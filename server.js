const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const rooms = {};

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('joinRoom', ({ roomId, peerId }) => {
        socket.join(roomId);
        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }
        rooms[roomId].push(peerId);
        socket.to(roomId).emit('newPeer', peerId);
    });

    socket.on('chatMessage', (messageData) => {
        const { peerId, text } = messageData;
        socket.to(roomId).emit('chatMessage', { peerId, text });
    });

    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
            socket.to(roomId).emit('peerLeft', socket.id);
        }
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
