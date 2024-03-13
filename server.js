const path = require('path');
const fs = require('fs');
const express = require('express');
const WebSocket = require('ws');
const cpen322 = require('./cpen322-tester.js');
const Database = require('./Database.js');
const SessionManager = require('./SessionManager');
const crypto = require('crypto');

const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'cpen322-messenger';

const db = new Database(mongoUrl, dbName);

db.connected.then(() => {
    console.log(`[MongoClient] Connected to ${mongoUrl}/${dbName}`);
}).catch(err => {
    console.error('[MongoClient] Connection error:', err);
});

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

const broker = new WebSocket.Server({ port: 8000 });

const messageBlockSize = 10;

const sessionManager = new SessionManager();

// express app
let app = express();
const bodyParser = require('body-parser');

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug
app.use(bodyParser.urlencoded({ extended: true }));

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));

let messages = {};

db.getRooms()
    .then(rooms => {
        rooms.forEach(room => {
            messages[room._id] = [];
        });
    })
    .catch(err => {
        console.error('Error initializing messages:', err);
    });

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
                    messages: messages[roomId].slice()
                };

                db.addConversation(conversation)
                .then(() => {
                    messages[roomId] = [];
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

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.getUser(username).then(user => {
        if (!user) {
            // not found --> redirect
            res.redirect('/login');
        } else {
            if (isCorrectPassword(password, user.password)) {
                // correct --> redirect
                sessionManager.createSession(res, username);
                res.redirect('/');
            } else {
                // incorrect --> redirect
                res.redirect('/login');
            }
        }
    }).catch(err => {
        console.error(err);
        res.status(500).send('Server error');
    });
});

function isCorrectPassword(password, saltedHash) {
    const salt = saltedHash.substring(0, 20);
    const storedHash = saltedHash.substring(20);

    const hash = crypto.createHash('sha256').update(password + salt).digest('base64');

    return hash === storedHash;
}

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

    db.getRooms().then(existingRooms => {
        const newRoomId = `room-${existingRooms.length + 1}`;
        const newRoom = {
            _id: newRoomId,
            name: roomData.name,
            image: roomData.image || 'assets/default-room-icon.png'
        };

        return db.addRoom(newRoom);
    })
    .then(addedRoom => {
        messages[addedRoom._id] = [];

        console.log("New room added successfully");
        res.status(200).json(addedRoom);
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

cpen322.connect('http://3.98.223.41/cpen322/test-a5-server.js');
cpen322.export(__filename, { app, db, messages, messageBlockSize, sessionManager, isCorrectPassword , broker });