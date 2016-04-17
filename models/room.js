'use strict';

/**
 * Module dependencies.
 */
const
  mongoose      = require('mongoose'),
  timestamp     = require('mongoose-timestamp');

/**
 * Room Model Definition.
 * @type {Schema}
 */
const RoomSchema = new mongoose.Schema({
  id: Number,
  username: String,
  hasUpdated: {
    type: Boolean,
    default: false
  },
  hasSuspended: {
    type: Boolean,
    default: false
  },
  user: {
    id: Number,
    firstName: String,
    lastName: String,
    username: String
  }
});


RoomSchema.plugin(timestamp);

mongoose.model('Room', RoomSchema);
module.exports = exports = RoomSchema;