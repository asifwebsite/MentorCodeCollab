const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors')
const mongoose = require("mongoose");
const CodeBlock = require('./models/codeBlock');

require('dotenv').config({ path: '.env' });

async function mongoConnect() {
    const mongoUri = process.env.MONGO_URI || "mongodb+srv://asifamar:NAsgTqCqRKxwJS4y@cluster0.kx4w292.mongodb.net/moveoDB";
    if (!mongoUri) {
        console.error('MongoDB connection string is not set in environment variables');
        process.exit(1);
    }
    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
    } catch (e) {
        console.error('Failed to connect to MongoDB:', e);
        process.exit(1); // Exit on connection failure
    }
}
mongoConnect();


const app = express();
// CORS configuration for localhost:3000
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // Enable credentials for CORS
}));
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const PORT = process.env.PORT || 3001;

app.get('/api/codeblocks', async (req, res) => {
    try {
        const codeBlocks = await CodeBlock.find({});
        res.send(codeBlocks);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/api/codeblocks/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const codeBlock = await CodeBlock.findById(id);
        if (!codeBlock) {
            return res.status(404).send('Code block not found');
        }
        res.send(codeBlock);
    } catch (err) {
        res.status(500).send(err);
    }
});

let roomMentors = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);

        if (!roomMentors[roomId]) {
            roomMentors[roomId] = socket.id;
            socket.emit('role', 'mentor');
        } else {
            socket.emit('role', 'student');
        }
    });

    socket.on('codeChange', (code, roomId) => {
        io.to(roomId).emit('codeUpdate', code);
    });

    socket.on('solutionChecked', (data) => {
        socket.to(data.roomId).emit('solutionChecked', data);
    });

    socket.on('resetRoom', (roomId) => {
        socket.to(roomId).emit('roomReset');
        io.socketsLeave(roomId);
        delete roomMentors[roomId];
    });

    socket.on('disconnect', () => {
        Object.keys(roomMentors).forEach(roomId => {
            if (roomMentors[roomId] === socket.id) {
                socket.to(roomId).emit('roomReset');
                io.socketsLeave(roomId);
                delete roomMentors[roomId];
            }
        });
    });
});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));