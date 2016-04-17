'use strict';

/**
 * Module dependencies.
 */

const
  mongoose      = require('mongoose'),
  timestamp     = require('mongoose-timestamp');


/**
 * Message Model Definition.
 * @type {Schema}
 */
const MessageSchema = new mongoose.Schema({
  messageId: Number,
  from: Object,
  date: Date,
  text: String
});

MessageSchema.plugin(timestamp);

mongoose.model('Message', MessageSchema);
module.exports = exports = MessageSchema;