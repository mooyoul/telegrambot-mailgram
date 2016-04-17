'use strict';
/**
 * Module dependencies.
 */
const
  Promise   = require('bluebird'),
  crypto    = require('crypto'),
  debug     = require('debug'),
  mongoose  = require('mongoose'),
  Room      = mongoose.model('Room');


const
  log       = debug('telegrambot-mailgram:command:start');


const
  findOrCreateRoom = (message) => {
    return new Promise((resolve, reject) => {
      Room.findOne({
        id: message.chat.id
      }).exec((e, room) => {
        if (e) { return reject(e); }

        if (room) {
          return resolve(room);
        }

        Room.create({
          id: message.chat.id,
          username: crypto.randomBytes(4).toString('hex'),
          user: message.from
        }, (e, room) => {
          if (e) { return reject(e); }

          resolve(room);
        })
      });
    });
  };

module.exports = exports = (bot) => {
  const handler = (message) => {
    findOrCreateRoom(message).then((room) => {
      bot.sendMessage(message.chat.id, [
        '안녕하세요! 메일봇을 사용해주셔서 감사합니다.',
        '',
        '본 메일봇은 무료로 제공되는 로봇입니다.',
        '개발자 Telegram: @mooyoul',
        '개발자가 만든 좋은 변호사 찾는 로톡: https://www.lawtalk.co.kr/tg3',
        '메일봇 Github: https://github.com/mooyoul/telegrambot-mailgram',
        '',
        `${room.username}@${process.env.DOMAIN}으로 이메일을 보내거나,`,
        '다음 명령어로 메일봇을 시작해보세요!'
      ].join('\n'), {
        reply_markup: JSON.stringify({
          one_time_keyboard: true,
          keyboard: [
            ['/help'],
            ['/setusername'],
            ['/getusername']
          ]
        })
      });
    }).catch((e) => {
      log(e.stack);
      bot.sendMessage(message.chat.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
    });
  };

  bot.onText(/\/start/, handler);
  bot.on('new_chat_participant', handler);

  bot.on('left_chat_participant', (msg) => {
    Room.findOne({
      id: msg.chat.id
    }).exec((e, room) => {
      if (e) {
        log(e.stack);
        return;
      }

      if (!room) {
        log('Empty room: ', msg);
        return;
      }

      room.hasSuspended = true;
      room.save((e) => {
        if (e) {
          log(e.stack);
        }
        log('Room %d has suspended T0T', room.id);
      });
    });
  });
};