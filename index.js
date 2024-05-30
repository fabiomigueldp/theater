const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let masterSocketId = null;

io.on('connection', (socket) => {
  console.log('New client connected');

  if (!masterSocketId) {
    masterSocketId = socket.id;
    io.to(socket.id).emit('set-master');
  }

  socket.on('play', (currentTime) => {
    if (socket.id === masterSocketId) {
      io.emit('play', currentTime);
    }
  });

  socket.on('pause', (currentTime) => {
    if (socket.id === masterSocketId) {
      io.emit('pause', currentTime);
    }
  });

  socket.on('seek', (currentTime) => {
    if (socket.id === masterSocketId) {
      io.emit('seek', currentTime);
    }
  });

  socket.on('current-time', (currentTime) => {
    if (socket.id === masterSocketId) {
      io.emit('sync-time', currentTime);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (socket.id === masterSocketId) {
      const remainingSockets = Object.keys(io.sockets.sockets);
      if (remainingSockets.length > 0) {
        masterSocketId = remainingSockets[0];
        io.to(masterSocketId).emit('set-master');
      } else {
        masterSocketId = null;
      }
    }
  });
});

// Emitir o tempo atual do mestre a cada 5 segundos
setInterval(() => {
  if (masterSocketId) {
    const masterSocket = io.sockets.sockets.get(masterSocketId);
    if (masterSocket) {
      masterSocket.emit('request-current-time');
    }
  }
}, 5000);

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
