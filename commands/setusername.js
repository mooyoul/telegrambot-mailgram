'use strict';

/**
 * Module dependencies.
 */
const
  debug           = require('debug'),
  mongoose        = require('mongoose'),
  Room            = mongoose.model('Room');

const
  log             = debug('telegrambot-mailgram:command:setusername');


const
  USERNAME_REGEXP = /^[0-9a-z\.\-_]{4,32}$/;

module.exports = exports = (bot) => {

  const validateUsername = (username, room, message, done) => {
    if (!username) {
      return askUsername(message, room, done);
    }

    username = username.toLowerCase();

    if (!username.match(USERNAME_REGEXP)) {
      bot.sendMessage(message.chat.id, '올바르지 않은 아이디입니다.');
      return askUsername(message, room, done);
    }

    if (room.username === username) {
      bot.sendMessage(message.chat.id, '아이디는 이전과 동일할 수 없습니다.');
      return askUsername(message, room, done);
    }

    Room.count({
      username: username
    }, (e, count) => {
      if (e) {
        log(e.stack);
        return bot.sendMessage(message.chat.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
      }

      if (count) {
        bot.sendMessage(message.chat.id, `'${username}'은(는) 이미 사용중인 아이디입니다 +0+`);
        return askUsername(message, room, done);
      }

      done(username, room, message);
    });
  };

  const askUsername = (message, room, done) => {
    bot.sendMessage(message.chat.id, [
      '변경할 아이디를 알려주세요.',
      '4자 이상 32자 이하의 알파벳, 숫자, 마침표(.), 하이픈(-), 밑줄(_)로 구성된 아이디만 사용가능합니다.',
      '알파벳은 소문자로 일괄 변환됩니다.',
      '아이디는 최초 1회만 변경할 수 있으니 신중히 결정하세요.'
    ].join('\n'), {
      reply_markup: JSON.stringify({
        force_reply: true
      })
    }).then((sended) => {
      bot.onReplyToMessage(sended.chat.id, sended.message_id, (message) => validateUsername(message.text, room, message, done));
    });
  };


  bot.onText(/\/setusername(?: (.+))?/, (msg, match) => {
    Room.findOne({
      id: msg.chat.id
    }, (e, room) => {
      if (e) {
        log(e.stack);
        return bot.sendMessage(msg.chat.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
      }

      if (!room) {
        log('Empty Room: ', msg);
        return bot.sendMessage(msg.chat.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
      }

      if (room.hasUpdated) {
        return bot.sendMessage(msg.chat.id, '이미 아이디를 설정하여 더 이상 변경하실 수 없습니다 T0T');
      }

      validateUsername(match[1], room, msg, (username, user, message) => {
        room.username = username;
        room.hasUpdated = true;
        room.save((e) => {
          if (e) {
            return bot.sendMessage(msg.chat.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
          }

          bot.sendMessage(message.chat.id, `*${username}* 아이디로 변경하였습니다.\n이제 ${username}@${process.env.DOMAIN} 으로 이메일을 받아보실 수 있습니다.`, {
            parse_mode: 'Markdown'
          });
        });
      });
    });
  });

};