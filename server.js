const path = require('path');
const fs = require('fs');
const express = require('express');

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

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

app.get('/chat', (req, res) => {
    // Build response array
    let chatData = chatrooms.map(room => {
        return {
            id: room.id,
            name: room.name,
            image: room.image,
            messages: messages[room.id]
        };
    });
    res.json(chatData);
});

app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});