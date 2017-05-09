const mongoose = require('mongoose')

mongoose.Promise = global.Promise;

const userSchema = mongoose.Schema({
  name: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
});

userSchema.methods.apiRepr = function() {
  return {
    name: this.name,
    email: this.email,
    id: this._id,
  };
};

module.exports = mongoose.model('User', userSchema)
