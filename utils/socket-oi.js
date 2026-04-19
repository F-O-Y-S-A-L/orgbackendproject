import app from '../app.js'
import { Server } from 'socket.io'
import http from 'http'

const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: true }
})

io.on('connection', (socket) => {
  socket.on("join", (userId) => {
    socket.join(userId.toString());
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export { io, server }
