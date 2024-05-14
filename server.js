const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
const PORT = 3001;
app.get('/', (req, res) => {
    res.send('Hello World');
});
const activeRooms = new Map();


io.on("connection", (socket) => {

    socket.emit("me", socket.id);

    socket.on("joinRoom", (roomId) => {
        // Join the room
        socket.join(roomId);
        // Add user to the room
        if (!activeRooms.has(roomId)) {
            activeRooms.set(roomId, new Set());
        }
        activeRooms.get(roomId).add(socket.id);
        // Notify other users in the room about the new user
        socket.to(roomId).emit("userJoined", socket.id);
        // Emit list of users in the room to the new user
        io.to(roomId).emit("usersInRoom", Array.from(activeRooms.get(roomId)));
    });





    socket.on("leaveRoom", (roomId) => {
        // Leave the room
        socket.leave(roomId);
        // Remove the user from activeRooms
        if (activeRooms.has(roomId)) {
            activeRooms.get(roomId).delete(socket.id);
            // Optionally, notify other users in the room about the user's departure
            socket.to(roomId).emit("userLeft", socket.id);
            // Emit updated list of users in the room
            io.to(roomId).emit("usersInRoom", Array.from(activeRooms.get(roomId)));
        }
    });








    socket.on("disconnect", () => {
        // Remove user from all active rooms
        activeRooms.forEach((participants, roomId) => {
            if (participants.has(socket.id)) {
                participants.delete(socket.id);
                // Notify other users in the room about the user leaving
                socket.to(roomId).emit("userLeft", socket.id);
                // Remove room if there are no more participants
                if (participants.size === 0) {
                    activeRooms.delete(roomId);
                }
            }
        });
    });

});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
