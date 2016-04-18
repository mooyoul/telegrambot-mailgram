'use strict';

/**
 * Module dependencies.
 */
const
  Promise       = require('bluebird'),
  debug         = require('debug'),
  crypto        = require('crypto'),
  mailin        = require('mailin'),
  AWS           = require('aws-sdk'),
  uuid          = require('node-uuid'),
  fileType      = require('file-type'),
  request       = require('request'),
  cheerio       = require('cheerio'),
  sanitizeHtml  = require('sanitize-html'),
  mongoose      = require('mongoose'),
  _             = require('underscore'),
  moment        = require('moment'),
  Mail          = mongoose.model('Mail'),
  Room          = mongoose.model('Room');

moment.locale('ko');

const log       = debug('telegrambot-mailgram:worker:receiver');
const tpl       = _.template([
  '<!DOCTYPE html>',
  '<html>',
  '<head>',
    '<meta charset="utf-8">',
    '<title><%=data.subject%></title>',
  '</head>',
  '<body>',
  '<p>',
    '보낸사람: <%=data.from ? data.from.map((from) => `${from.name}${from.name ? " " : ""}&lt;${from.address}&gt;`) : "(정보 없음)"  %>',
    '<br>',
    '날짜: <%=data.date%>',
    '<br>',
    '제목: <%=data.subject%>',
    '<br>',
    '받는사람: <%=data.to ? data.to.map((to) => `${to.name}${to.name ? " " : ""}&lt;${to.address}&gt;`) : "(정보 없음)" %>',
  '</p>',
  '<%=data.body%>',
  '</body>',
  '</html>'
].join('\n'), {variable: 'data'});

const fetchImage = (url) => {
  return new Promise((resolve, reject) => {
    request({
      method: 'GET',
      url: url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36'
      },
      strictSSL: false,
      timeout: 1000 * 30,
      encoding: null
    }, (e, res, bufBody) => {
      if (e) { return reject(e); }
      if (res.statusCode !== 200) {
        return reject(new Error('Response code is not 200'));
      }

      const type = fileType(bufBody);
      if (! type) {
        return reject(new Error('Unknown file type.'));
      }

      resolve({
        type: type,
        base64: bufBody.toString('base64')
      });
    });
  });
};

const injectImages = (html) => {
  return new Promise((resolve) => {
    const $ = cheerio.load(html);

    const $images = $('img').filter((index, el) => {
      const src = $(el).attr('src');
      return src && (src.indexOf('http') === 0);
    });

    Promise.map(Array.prototype.slice.call($images.map((i, el) => $(el).attr('src'))), (src, index) => {
      return fetchImage(src)
        .then((data) => Promise.resolve({
          $el: $images.eq(index),
          data: data
        })).catch((e) => Promise.resolve({
          $el: $images.eq(index),
          data: e
        }));
    }, {concurrency: 2}).then((images) => {
      images.forEach((image) => {
        if (image && image.data && image.data.base64) {
          image.$el.attr('src', `data:${image.data.type.mime};base64,${image.data.base64}`);
        }
      });

      resolve($.html());
    });
  });
};

const uploadToS3 = (key, bufData) => {
  return new Promise((resolve, reject) => {
    const
      s3 = new AWS.S3({params: {Bucket: process.env.AWS_S3_INBOX_BUCKET, Key: key}}),
      expires = moment().add('3', 'days').toDate();

    s3.upload({
      ACL: 'public-read',
      ContentType: 'text/html',
      Expires: expires,
      ServerSideEncryption: 'AES256',
      Body: bufData
    }).send((e, response) => {
      if (e) { return reject(e); }

      response.expires = expires;
      resolve(response);
    });
  });
};

const forwardMessage = (bot, room, data) => {
  return new Promise((resolve, reject) => {
    Mail.create({
      room: room._id,
      from: data.envelopeFrom.address,
      to: data.envelopeTo.map((to) => to.address),
      subject: data.subject
    }, (e) => {
      if (e) {
        log(e.stack);
      }

      uploadToS3(`mail/${room._id.toString()}/${uuid.v4()}`, new Buffer(tpl({
        subject: data.subject,
        body: data.html || data.text,
        from: data.from,
        to: data.to,
        date: moment(data.date).format('LL LT')
      }), 'utf8'))
      .then((res) => {
        const from = data.from ? data.from.map((from) => `${from.name}${from.name ? " " : ""}&lt;${from.address}&gt;`) : '(발송인 정보 없음)';

        return bot.sendMessage(room.id, [
          `<strong>${data.subject}</strong>`,
          `- ${from}`,
          ``,
          `${data.text ? sanitizeHtml(data.text.substr(0, 300), {allowedTags: []}) + '...' : '(텍스트 본문 없음)'}`,
          ``,
          `<a href="${res.Location}">이메일 확인하기 (${moment(res.expires).format('M월 D일 H:m 까지')})</a>`,
          `위 링크는 3일간 서버에 저장되며, 유효기간이 지난 후에는 서버에서 해당 링크를 폐기합니다.`,
          `아래 첨부된 이메일 파일을 다운로드 받아, 미리보기가 삭제된 이후에도 해당 이메일을 계속 열람하실 수 있습니다.`,
          `첨부된 이메일 파일을 통해 이메일을 확인하는 경우, 모바일 환경에서는 그림이 표시되지 않을 수 있으니 데스크탑 텔레그램 클라이언트에서 파일을 확인해주세요.`,
          `또한, 위 링크가 외부로 노출되는 경우 누구나 해당 이메일을 읽을 수 있으므로, 링크가 제3자에게 노출되지 않도록 주의하시기 바랍니다.`
        ].join('\n'), {parse_mode: 'HTML'});
      }).then((sent) => {
        return injectImages(data.html);
      }).then((body) => {
        const opts = {
          qs: {
            chat_id: room.id
          }
        };
        opts.formData = {
          document: {
            value: new Buffer(tpl({
              subject: data.subject,
              body: body || data.text,
              from: data.from,
              to: data.to,
              date: moment(data.date).format('YYYY년 M월 D일 A h:mm')
            }), 'utf8'),
            options: {
              filename: `${room.username}_${data.subject.replace(/\s+/g, '_').replace(/[^0-9a-z_]/gi, '').substr(0, 16)}.html`,
              contentType: 'text/html'
            }
          }
        };
        return bot._request('sendDocument', opts);
      }).then((sent) => {
        resolve(sent);
      }).catch((e) => {
        reject(e);
      });
    });
  });
};


module.exports = exports = (bot) => {
  mailin.start({
    port: 25,
    disableWebhook: true,
    smtpOptions: {
      name: process.env.PTR_RECORD_HOSTNAME
    }
  });

  mailin.on('validateRecipient', (connection, email, done) => {
    const host = email && email.split('@');
    if (!host) {
      return done(new Error('Empty host information.'), false);
    }

    if (host[1] !== process.env.DOMAIN) {
      return done(new Error(`Only \`${process.env.DOMAIN}\` is allowed to receive email!`));
    }

    done(null);
  });

  mailin.on('authorizeUser', (connection, username, password, done) => {
    done(new Error('Not Implemented!'), false);
  });


  mailin.on('message', function (connection, data, content) {
    console.log(data.headers);

    const usernames = data.envelopeTo.map((to) => {
      const addressChunks = to.address && to.address.split('@');

      return addressChunks && addressChunks.length && addressChunks[0].toLowerCase();
    }).filter((to) => to);


    Room.find({
      username: {
        $in: usernames
      }
    }).exec((e, rooms) => {
      if (e) {
        log(e.stack);
        return;
      }

      if (!rooms.length) { // there are no receipts, maybe junk (spam) mail?
        Mail.create({
          type: 'junk',
          from: data.envelopeFrom.address,
          to: data.envelopeTo.map((to) => to.address),
          subject: data.subject
        }, (e) => {
          if (e) {
            log(e.stack);
          }
        });
        return;
      }

      Promise.map(rooms, (room) => forwardMessage(bot, room, data), {concurrency: 2});
    });
  });
};