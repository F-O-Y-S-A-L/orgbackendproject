import app from '../app.js'
import { Server } from 'socket.io'
import http from 'http'

const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: "https://org-node.vercel.app", credentials: true }
})

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)
  socket.on("join", (userId) => {
    console.log(`User ${userId} joined room`)
    socket.join(userId.toString());
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export { io, server }
