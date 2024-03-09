const path = require('path');
const fs = require('fs');
const express = require('express');
const WebSocket = require('ws');
const cpen322 = require('./cpen322-tester.js');
// ----------------------------------------------------TASK 1----------------------------------------------------
const Database = require('./Database.js');

const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'cpen322-messenger';

const db = new Database(mongoUrl, dbName);

db.connected.then(() => {
    console.log(`[MongoClient] Connected to ${mongoUrl}/${dbName}`);
}).catch(err => {
    console.error('[MongoClient] Connection error:', err);
});

// ----------------------------------------------------TASK 1----------------------------------------------------

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

const broker = new WebSocket.Server({ port: 8000 });

const messageBlockSize = 10; // Adjust as necessary

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));

// let chatrooms = [
//     { id: "room-1", name: "Room 1", image: "assets/everyone-icon.png" },
//     { id: "room-2", name: "Room 2", image: "assets/everyone-icon.png" },
//     { id: "room-3", name: "Room 3", image: "assets/everyone-icon.png" },
//     { id: "room-4", name: "Room 4", image: "assets/everyone-icon.png" }
// ];

let messages = {};

// TASK 2 PART B
db.getRooms()
    .then(rooms => {
        rooms.forEach(room => {
            messages[room._id] = [];
        });
    })
    .catch(err => {
        console.error('Error initializing messages:', err);
    });

// chatrooms.forEach(room => {
//     messages[room.id] = [];
// });

broker.on('connection', function connection(ws) {
    console.log('Client connected');

    ws.on('message', function incoming(message) {
        console.log('Received message:', message);
        
		try {
			const parsedMessage = JSON.parse(message);
			const { roomId, username, text } = parsedMessage;
			const serializedMessage = JSON.stringify({ roomId, username, text });

			if (!messages[roomId]) {
				messages[roomId] = [];
			}
			messages[roomId].push({ username, text });

			broker.clients.forEach(function each(client) {
				if (client !== ws && client.readyState === WebSocket.OPEN) {
                    console.log('Broadcasting message to client');
					client.send(serializedMessage);
				}
			});

            if (messages[roomId].length === messageBlockSize) {
                const conversation = {
                    room_id: roomId,
                    timestamp: Date.now(),
                    messages: messages[roomId].slice() // Copy the messages
                };

                db.addConversation(conversation)
                .then(() => {
                    messages[roomId] = []; // Clear messages for the room after saving
                }).catch(err => {
                    console.error('Error saving conversation:', err);
                });
            }

		} catch (error) {
            console.error('Error parsing incoming message:', error);
        }
    });

	ws.on('close', function () {
        console.log('Client disconnected');
    });
});

// TASK 2 PART C
app.get('/chat', async (req, res) => {
    try {
        const rooms = await db.getRooms();
        const chatData = rooms.map(room => {
            return {
                id: room._id,
                name: room.name,
                image: room.image,
                messages: messages[room._id] || []
            };
        });
        res.json(chatData);
    } catch (error) {
        console.error("Error handling GET request for /chat:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// TASK 2 PART E
app.get('/chat/:room_id', async (req, res) => {
    const room_id = req.params.room_id;
	console.log("Room ID:", room_id);

	let room = await db.getRoom(room_id);
	if (room) {
		res.json(room);
	} else {
		res.status(404).json({ error: `Room ${room_id} was not found` });
	}
});

app.post('/chat', (req, res) => {
    console.log("Received POST request to /chat with data:", req.body);
    const roomData = req.body;

    if (!roomData || !roomData.name) {
        console.error("Name field is required");
        res.status(400).json({ error: 'Name field is required' });
        return;
    }

    // Count existing rooms to generate new room ID
    db.getRooms().then(existingRooms => {
        const newRoomId = `room-${existingRooms.length + 1}`; // Generate new room ID
        const newRoom = {
            _id: newRoomId, // Assign new room ID
            name: roomData.name,
            image: roomData.image || 'assets/default-room-icon.png' // Default image if not provided
        };

        return db.addRoom(newRoom); // Add the new room to the database
    })
    .then(addedRoom => {
        messages[addedRoom._id] = []; // Initialize an empty array for messages in the new room

        console.log("New room added successfully");
        res.status(200).json(addedRoom); // Send back the new room data including the _id
    })
    .catch(err => {
        console.error("Error adding new room:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.get('/chat/:room_id/messages', (req, res) => {
    const room_id = req.params.room_id;
    const before = req.query.before ? parseInt(req.query.before) : Date.now();

    db.getLastConversation(room_id, before)
    .then(conversation => {
        if (conversation) {
            res.json(conversation);
        } else {
            res.status(404).json({ error: `No conversation found for room ${room_id}` });
        }
    })
    .catch(err => {
        console.error('Error getting last conversation:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});





app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

cpen322.connect('http://3.98.223.41/cpen322/test-a4-server.js');
cpen322.export(__filename, { app, db, messages, messageBlockSize, broker });