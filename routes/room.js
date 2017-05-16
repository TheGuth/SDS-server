const Room = require('../models/room-model');
const User = require('../models/user-model');

module.exports = function(app) {
  // Create a new room with the current User being added to rooms users.
  app.post('/api/:id/room', (req, res) => {
    let currentUserId = req.params.id
    User
    .findById(currentUserId)
    .then(user => {
      return Room
      .create({
        users: [user],
        messages: [],
      });
    })
    .then(room => {
      console.log(room);
      return User
      .findByIdAndUpdate(
        currentUserId,
        { $push: {rooms: room }},
        {new: true}
      )
    })
    .then(user => {
      res.status(200).json(user.apiRepr());
    })
    .catch(error => {
      res.status(500).json({message: 'Internal Server Error'});
    })
  });

  // grab all rooms
  app.get('/api/rooms', (req, res) => {
    Room
    .find({})
    .then(rooms => {
      res.status(200).json(rooms);
    })
  });

  // grab specific room by id
  app.get('/api/room/:id', (req, res) => {
    Room
    .findById(req.params.id)
    .then(room => {
      res.status(200).json(room.apiRepr());
    })
    .catch(error => {
      res.status(500).json({message: 'Internal server error'});
    });
  });

  // delete room
  // need to find each user id and remove from their room array.
  app.delete('/api/room/:id', (req, res) => {
    Room
    .findById(req.params.id)
    .then(room => {
      deleteUserRooms(room.users, req.params.id);
      Room
      .findOneAndRemove({_id: req.params.id}, (err, room) => {
        if (err) {
          throw err;
        }
        if (room) {
          res.status(200).json({message: 'Room found and deleted', room: room})
        } else {
          res.status(500).json({message: 'No room found'});
        }
      });
    })
  });

  // takes a rooms users array as an argument.
  function deleteUserRooms(userArray, roomId) {
    userArray.map(user => {
      User
      .findOneAndRemove(
        {_id: user._id},
        { $pull: { rooms: { _id: roomId }}}
      )
      .then(user => {
        return user;
      })
      .catch(error => {
        res.status(500).json({message:  'No Users'})
      })
    })
  }

  // add user to a specific room
  // and add room to the specified user
  app.post('/api/room/:id/add', (req, res) => {
    let currentUserId = req.body.currentUserId
    User
    .findById(currentUserId)
    .then(user => {
      return Room
      .findByIdAndUpdate(
        req.params.id,
        {$push: {users: user}},
        {new: true}
      );
    })
    .then(updatedRoom => {
      console.log(updatedRoom);
      console.log(updatedRoom)
      return User
      .findByIdAndUpdate(
        currentUserId,
        { $push: {rooms: updatedRoom }},
        { new: true }
      )
    })
    .then(updatedUser => {
      res.status(200).json(updatedUser.apiRepr());
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({error: 'Internal Server Error'});
    });
  });

    // remove user from a specific room
    // also removes room from user room array.
  function updateUser(userId, roomId) {
    console.log('user id and room id', userId, roomId)
    return User
    .findById(userId)
    .then(user => {
      console.log('inside updateUser function', user)
      return user.rooms.filter(room => {
        return (String(room._id) !== String(roomId))
      })
    })
    .then(newRoomList => {
      return User.findByIdAndUpdate(
        userId,
        { $set: { rooms: newRoomList }},
        { new: true }
      );
    });
  }

  app.put('/api/room/:id/remove', (req, res) => {
    const userId = req.body.userId;
    Room
    .findById(req.params.id)
    .then(room => {
      return room.users.filter(user => {
        return (user._id != userId)
      })
    })
    .then(newUserList => {
      console.log(newUserList)
      return Room.findByIdAndUpdate(
        req.params.id,
        { $set: { users: newUserList }},
        { new: true }
      )
    })
    .then(room => {
      updateUser(userId, room._id);
      res.status(200).json(room.apiRepr());
    })
    .catch(error => {
      res.status(500).json({error: 'Internal Server Error'});
    });
  });

};
