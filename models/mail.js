'use strict';

/**
 * Module dependencies.
 */

const
  mongoose      = require('mongoose'),
  timestamp     = require('mongoose-timestamp'),
  autoIncrement = require('mongoose-auto-increment');

/**
 * Mail Model Definition.
 * @type {Schema}
 */
const MailSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.ObjectId,
    ref: 'Room'
  },
  type: {
    type: String,
    enum: ['normal', 'junk'],
    defaults: 'normal'
  },
  from: String,
  to: [String],
  subject: String,
  number: Number
});

MailSchema.plugin(timestamp);
MailSchema.plugin(autoIncrement.plugin, {
  model: 'Mail',
  field: 'number',
  startAt: 1
});

mongoose.model('Mail', MailSchema);
module.exports = exports = MailSchema;