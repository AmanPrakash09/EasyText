const path = require('path');
const fs = require('fs');
const express = require('express');
const WebSocket = require('ws');
const cpen322 = require('./cpen322-tester.js');
// ----------------------------------------------------TASK 1----------------------------------------------------
const Database = require('./Database.js');

const mongoUrl = 'mongodb://localhost:27017';
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

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));

let chatrooms = [
    { id: "room-1", name: "Room 1", image: "assets/everyone-icon.png" },
    { id: "room-2", name: "Room 2", image: "assets/everyone-icon.png" },
    { id: "room-3", name: "Room 3", image: "assets/everyone-icon.png" },
    { id: "room-4", name: "Room 4", image: "assets/everyone-icon.png" }
];

let messages = {};
chatrooms.forEach(room => {
    messages[room.id] = [];
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
		} catch (error) {
            console.error('Error parsing incoming message:', error);
        }
    });

	ws.on('close', function () {
        console.log('Client disconnected');
    });
});

app.get('/chat', (req, res) => {
	console.log("GET request received for /chat");
	try {
		let chatData = chatrooms.map(room => {
			return {
				id: room.id,
				name: room.name,
				image: room.image,
				messages: messages[room.id]
			};
		});
		console.log("Sending chat data:", chatData);
		res.json(chatData);
    } catch (error) {
        console.error("Error handling GET request for /chat:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/chat', (req, res) => {
	console.log("Received POST request to /chat with data:", req.body);
    const data = req.body;

    if (!data || !data.name) {
		console.error("Name field is required");
        res.status(400).json({ error: 'Name field is required' });
        return;
    }

    const roomId = `room-${chatrooms.length + 1}`;

    const newRoom = {
        id: roomId,
        name: data.name,
        image: data.image
    };

    chatrooms.push(newRoom);

    messages[roomId] = [];

	console.log("New room added successfully");

    res.status(200).json(newRoom);
});


app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

cpen322.connect('http://3.98.223.41/cpen322/test-a4-server.js');
// cpen322.export(__filename, { app, chatrooms, db, messages, messageBlockSize, broker });
cpen322.export(__filename, { app, chatrooms, db, messages, broker });