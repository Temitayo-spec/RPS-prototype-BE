const rooms = {};

const createRoom = (roomId, user1Id) => {
  rooms[roomId] = [user1Id, ''];
  return rooms[roomId][0];
};

const joinRoom = (roomId, user2Id) => {
  rooms[roomId][1] = user2Id;
};

const exitRoom = (roomId, player) => {
  if (rooms[roomId]) {
    rooms[roomId][player] = '';
    return rooms[roomId];
  } else {
    return null;
  }
};

module.exports = { createRoom, joinRoom, exitRoom, rooms };
