const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const { createRoom, joinRoom, exitRoom, rooms } = require('./utils/room');
const {
  initializeChoices,
  userConnected,
  makeMove,
  choices,
  moves,
  connectedUsers,
} = require('./utils/users');

io.on('connection', (socket) => {
  console.log(`a user connected ${socket.id}`);
  socket.on('join_room', (roomId) => {
    if (!rooms[roomId]) {
      const error = "This room doesn't exist";
      socket.emit('display_error', error);
    } else {
      userConnected(socket.client.id);
      joinRoom(roomId, socket.client.id);
      socket.join(roomId);

      socket.emit('room_joined', roomId);
      socket.emit('player_2_connected');
      socket.broadcast.to(roomId).emit('player_2_connected');
      initializeChoices(roomId);
    }
  });

  socket.on('join_random', () => {
    let roomId = '';

    for (let id in rooms) {
      if (rooms[id][1] === '') {
        roomId = id;
        break;
      }
    }

    if (roomId === '') {
      const error = 'All rooms are full or none exists';
      socket.emit('display_error', error);
    } else {
      userConnected(socket.client.id);
      joinRoom(roomId, socket.client.id);
      socket.join(roomId);

      socket.emit('room_joined', roomId);
      socket.emit('player_2_connected');
      socket.broadcast.to(roomId).emit('player_2_connected');
      initializeChoices(roomId);
    }
  });

  socket.on('create_room', (roomId) => {
    if (rooms[roomId]) {
      const error = 'This room already exists';
      socket.emit('display_error', error);
    } else {
      userConnected(socket.client.id);
      createRoom(roomId, socket.client.id);
      socket.emit('room_created', roomId);
      socket.emit('player_1_connected');
      socket.join(roomId);
    }
  });

  socket.on('disconnect', () => {
    if (connectedUsers[socket.client.id]) {
      let player;
      let roomId;

      for (let id in rooms) {
        if (
          rooms[id][0] === socket.client.id ||
          rooms[id][1] === socket.client.id
        ) {
          if (rooms[id][0] === socket.client.id) {
            player = 1;
          } else {
            player = 2;
          }

          roomId = id;
          break;
        }
      }

      exitRoom(roomId, player);

      if (player === 1) {
        io.to(roomId).emit('player_1_disconected');
      } else {
        io.to(roomId).emit('player_2_disconected');
      }
    }
  });

  socket.on('make_move', ({ playerId, myChoice, roomId }) => {
    makeMove(roomId, playerId, myChoice);
    console.log({ myChoice }, { roomId }, { playerId });

    // check if player 1 makes move then notify player 2 to make move and vice versa
    if (choices[roomId][0] !== '' && choices[roomId][1] !== '') {
      io.to(roomId).emit('move_made', {
        player1Choice: choices[roomId][0],
        player2Choice: choices[roomId][1],
      });
    } else if (choices[roomId][0] !== '') {
      socket.broadcast.to(roomId).emit('player_1_made_move');
    } else {
      socket.broadcast.to(roomId).emit('player_2_made_move');
    }

    if (choices[roomId][0] !== '' && choices[roomId][1] !== '') {
      if (choices[roomId][0] === choices[roomId][1]) {
        let message =
          'Both of you choose ' + choices[roomId][0] + ".So it's draw";
        io.to(roomId).emit('draw', message);
      } else if (moves[choices[roomId][0]] === choices[roomId][1]) {
        let message =
          'Player 1 choose ' +
          choices[roomId][0] +
          ' and Player 2 choose ' +
          choices[roomId][1] +
          '. So Player 1 wins';
          choices[roomId] = ['', ''];
        io.to(roomId).emit('player_1_wins', message);
      } else {
        let message =
          'Player 1 choose ' +
          choices[roomId][0] +
          ' and Player 2 choose ' +
          choices[roomId][1] +
          '. So Player 2 wins';
          choices[roomId] = ['', ''];
        io.to(roomId).emit('player_2_wins', message);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Language: javascript
// Path: backend\utils\room.js
