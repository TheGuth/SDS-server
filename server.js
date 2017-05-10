const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const {DATABASE_URL, PORT} = require('./config');

const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

const User = require('./models');

mongoose.Promise = global.Promise;

app.get('/', (req, res) => {
  console.log('hello');
})

app.get('/api/users/:userEmail', (req, res) => {
  User
    .findOne({ email: req.params.userEmail })
    .then(user => {
      if (!user) {
        return res.status(404).json({message: 'Email not found in database'});
      } else {
        return res.status(201).json(user.apiRepr());
      }
    })
    .catch(err => {
      res.status(500).json({message: 'Internal server error'})
    });
})

app.get('/api/users', (req, res) => {
  return User.find({})
  .then(users => {
    return res.status(201).json(users);
  })
})

app.post('/api/users', (req, res) => {
  if (!req.body) {
    return res.status(400).json({message: 'No request body'});
  }

  if (!('name' in req.body)) {
    return res.status(422).json({message: 'Missing field: name'});
  }

  if (!req.body) {
    return res.status(400).json({message: 'No request body'});
  }

  if (!('name' in req.body)) {
    return res.status(422).json({message: 'Missing field: name'});
  }

  let {email, password, name} = req.body;

  email = email.trim();
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
      return User
        .create({
          name: name,
          password: password,
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
