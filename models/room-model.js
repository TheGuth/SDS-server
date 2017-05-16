const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const roomSchema = mongoose.Schema({
  users: {type: Array, default: []}, // [ {user obj}, user obj]
  messages: {type: Array, default: []},
});

roomSchema.methods.apiRepr = function() {
  return {
    users: this.users,
    messages: this.messages,
    id: this._id
  };
};

module.exports = mongoose.model('Room', roomSchema)
