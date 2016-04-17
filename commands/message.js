'use strict';

/**
 * Module dependencies.
 */

const
  mongoose  = require('mongoose'),
  debug     = require('debug'),
  Message   = mongoose.model('Message');

const
  log       = debug('telegrambot-mailgram:log');

module.exports = exports = (bot) => {
  bot.on('message', (msg) => {
    Message.create({
      messageId: msg.message_id,
      from: {
        id: msg.from.id,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        type: msg.from.type
      },
      date: new Date(msg.date * 1000),
      text: msg.text
    }, (e) => {
      if (e) { return log(e); }
    });
  });
};