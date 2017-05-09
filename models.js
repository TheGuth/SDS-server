const mongoose = require('mongoose')

const userSchema = new mongoose.Schema( {
  name: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
});

userSchema.methods.apiRepr = () => {
  return {
    name: this.name,
    email: this.email,
    id: this._id,
  }
}

const User = mongoose.model('User', userSchema);

module.exports = { User };
