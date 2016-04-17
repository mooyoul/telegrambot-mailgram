'use strict';

/**
 * Module dependencies.
 */
const
  debug           = require('debug'),
  mongoose        = require('mongoose'),
  Room            = mongoose.model('Room');

const
  log             = debug('telegrambot-mailgram:command:getusername');


module.exports = exports = (bot) => {
  bot.onText(/\/getusername(?: (.+))?/, (msg) => {
    Room.findOne({
      id: msg.chat.id
    }, (e, room) => {
      if (e) {
        log(e.stack);
        return bot.sendMessage(msg.chat.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
      }

      if (!room) {
        log('Empty room: ', room);
        return bot.sendMessage(msg.chat.id, '으앙! 서버에서 에러가 발생했습니다. 나중에 다시 시도해주세요. 불편을 끼쳐드려 죄송합니다 ㅠ_ㅠ');
      }

      bot.sendMessage(msg.chat.id, `현재 설정된 이메일주소는 ${room.username}@${process.env.DOMAIN} 입니다.`);
    });
  });
};