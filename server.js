const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const {BasicStrategy} = require('passport-http');
const passport = require('passport');
const bcrypt = require('bcryptjs');

const {DATABASE_URL, PORT} = require('./config');
const User = require('./models');

const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

mongoose.Promise = global.Promise;

const basicStrategy = new BasicStrategy(
  (email, password, callback) => {
    let user;
    User
      .findOne({email})
      .exec()
      .then(_user => {
        user = _user;
        if (!user) {
          return callback(null, false, "Incorrect Email");
        }
        return user.validatePassword(password);
      })
      .then(isValid => {
        if (!isValid) {
          return callback(null, false, "Incorrect password");
        }
        else {
          return callback(null, user);
        }
      });
});

passport.use(basicStrategy);
app.use(passport.initialize());





app.get('/api/users/:userEmail', passport.authenticate('basic', {session: false}), (req, res) => {
  userEmail = req.params.userEmail.toLowerCase();
  User
    .findOne({ email: userEmail })
    .then(user => {
      if (!user) {
        return res.status(404).json({message: 'Email not found in database'});
      } else {
        return res.status(200).json(user.apiRepr());
      }
    })
    .catch(err => {
      res.status(500).json({message: 'Internal server error'})
    });
})

                  //TODO THIS IS ONLY FOR DEV USE; TAKE OUT FOR PRODUCTION
app.get('/api/users', (req, res) => {
  return User.find({})
  .then(users => {
    return res.status(200).json(users);
  })
})

app.post('/api/users', (req, res) => {
  if (!req.body) {
    return res.status(400).json({message: 'No request body'});
  }

  if (!("name" in req.body)) {
    return res.status(422).json({message: 'Missing field: name'});
  }

  let {email, password, name} = req.body;

  email = email.trim().toLowerCase();
  name = name.trim();
  password = password.trim();

  if (typeof name !== 'string') {
    return res.status(422).json({message: 'Empty field type: name'});
  }

  if (name === '') {
    return res.status(422).json({message: 'Empty field length: name'});
  }

  if (email === '') {
    return res.status(422).json({message: 'Empty field length: email'})
  }

  if (!(password)) {
    return res.status(422).json({message: 'Missing field: password'});
  }

  if (typeof password !== 'string') {
    return res.status(422).json({message: 'Incorrect field type: password'});
  }

  if (password === '') {
    return res.status(422).json({message: 'Incorrect field length: password'});
  }

  // check for existing user with same email before creating...
  return User
    .find({email})
    .count()
    .then(count => {
      if (count > 0) {
        return res.status(422).json({message: 'email already taken'});
      }
      return User.hashPassword(password);
    })
    .then(hash => {
      return User
        .create({
          name: name,
          password: hash,
          email: email,
        })
    })
    .then(user => {
      return res.status(201).json(user.apiRepr());
    })
    .catch(err => {
      res.status(500).json({message: 'Internal server error'})
    });
})

app.delete('/api/users/:userEmail', passport.authenticate('basic', {session: false}), (req, res) => {
  userEmail = req.params.userEmail.toLowerCase();
  User
    .findOneAndRemove({email: userEmail}, (err, user) => {
      if (err) {
        throw err;
      }
      if (user) {
        res.status(200).json({message: 'User found and deleted', user: user});
      }
      else {
        res.status(500).json({message: 'No user found'});
      }
    })
})

// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {runServer, app, closeServer};
