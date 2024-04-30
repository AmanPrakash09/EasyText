const path = require('path');
const fs = require('fs');
const express = require('express');
const WebSocket = require('ws');
const cpen322 = require('./cpen322-tester.js');
const Database = require('./Database.js');
const SessionManager = require('./SessionManager.js');
const sessionManager = new SessionManager();
const crypto = require('crypto');
const {generateChatResponse, transcribeAudio} = require('./OpenAI-API-Calls.js');
const fileUpload = require('express-fileupload');

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
const distPath = path.join(clientApp, 'dist');
const modelsPath = path.join(__dirname, 'models');
const faceapiPath = path.join(__dirname, 'face-api.min.js');

const broker = new WebSocket.Server({ port: 8000 });

const messageBlockSize = 10;

// express app
const app = express();

// to upload audio files
app.use(fileUpload({
    createParentPath: true
}));
app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debugdebug
app.use('/face-api.min.js', express.static(faceapiPath));
app.use('/models', express.static(modelsPath));
// serve static files from 'dist' directory under 'clientApp'
app.use('/dist', express.static(distPath));

let messages = {};

function sanitizeString(str) {
    return str.replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;')
              .replace(/&(?!(amp;|lt;|gt;|quot;|apos;|#039;))/g, '&amp;');
}

function saveConversationIfNecessary(roomId, ws = null) {
    if (messages[roomId] && messages[roomId].length > 0) {
        if (messages[roomId].length >= messageBlockSize || ws == null) {
            const conversation = {
                room_id: roomId,
                timestamp: Date.now(),
                messages: messages[roomId].slice()
            };

            db.addConversation(conversation)
            .then(() => {
                console.log('Conversation saved for room:', roomId);
                messages[roomId] = [];
            })
            .catch(err => {
                console.error('Error saving conversation for room:', roomId, err);
            });
        } else if (ws) {
            // timeout to save messages if block size is not reached within a 10 seconds
            clearTimeout(ws.saveConversationTimeout);
            ws.saveConversationTimeout = setTimeout(() => {
                saveConversationIfNecessary(roomId);
            }, 10000);
        }
    }
}

db.getRooms()
    .then(rooms => {
        rooms.forEach(room => {
            messages[room._id] = [];
        });
    })
    .catch(err => {
        console.error('Error initializing messages:', err);
    });

    broker.on('connection', function connection(ws, req) {
        console.log('Client connected');
    
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) {
            console.log('No cookie header, closing WebSocket connection.');
            ws.close();
            return;
        }
    
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [name, value] = cookie.split('=').map(c => c.trim());
            acc[name] = value;
            return acc;
        }, {});
    
        const sessionToken = cookies['cpen322-session'];
        if (!sessionManager.isValidSession(sessionToken)) {
            console.log('Invalid session, closing WebSocket connection.');
            ws.close();
            return;
        }
    
        ws.username = sessionManager.getUsername(sessionToken);
    
        ws.on('message', function incoming(messageBuffer) {
            
            console.log('Received message:', messageBuffer);
    
            try {
                let parsedMessage = JSON.parse(messageBuffer.toString());
                let roomId = parsedMessage.roomId;
                parsedMessage.text = sanitizeString(parsedMessage.text);
                parsedMessage.username = ws.username;
                let username = parsedMessage.username;
                let text = parsedMessage.text;
    
                const serializedMessage = JSON.stringify(parsedMessage);
    
                broker.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(serializedMessage);
                    }
                });
    
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
    
                saveConversationIfNecessary(roomId, ws);
    
            } catch (error) {
                console.error('Error parsing incoming message:', error);
            }
        });
    
        ws.on('close', function () {
            saveConversationIfNecessary(ws.roomId);
            console.log('Client disconnected');
        });
    });

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await db.getUser(username);
        
        if (!user) {
            res.redirect('/login');
        } else {
            if (isCorrectPassword(password, user.password)) {
                sessionManager.createSession(res, username);
                res.redirect('/');
            } else {
                res.redirect('/login');
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.use('/login', express.static(clientApp + '/login.html', {extensions: ['html', 'css']}));
app.use('/', sessionManager.middleware, express.static(clientApp, {extensions: ['html', 'css']}));

app.get('/chat/:room_id/messages', sessionManager.middleware, (req, res) => {
    const room_id = req.params.room_id;
    const before = req.query.before ? parseInt(req.query.before) : Date.now();

    db.getLastConversation(room_id, before)
    .then(conversation => {
        if (conversation) {
            console.log('Server is sending the last conversation!');
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

app.get('/chat/:room_id', sessionManager.middleware, async (req, res) => {
    const room_id = req.params.room_id;
	console.log("Room ID:", room_id);

	let room = await db.getRoom(room_id);
	if (room) {
		res.json(room);
	} else {
		res.status(404).json({ error: `Room ${room_id} was not found` });
	}
});

app.post('/chat', sessionManager.middleware, (req, res) => {
    console.log("Received POST request to /chat with data:", req.body);
    const roomData = req.body;
    

    if (!roomData || !roomData.name) {
        console.error("Name field is required");
        res.status(400).json({ error: 'Name field is required' });
        return;
    }
    roomData.name = sanitizeString(roomData.name);

    

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

app.get('/chat', sessionManager.middleware, async (req, res) => {
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

// endpoint to get all users
app.get('/users', sessionManager.middleware, async (req, res) => {
    try {
        const users = await db.getUsers();
        res.json(users.map(user => ({ username: user.username })));
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// endpoint to get generated response
app.get('/chat/:room_id/generatedresponse', sessionManager.middleware, (req, res) => {
    const room_id = req.params.room_id;
    const limit = parseInt(req.query.limit) || 10;
    const username = req.query.username;
    const user = req.query.user;
    console.log("Trying to get generated response");

    db.getLatestMessages(room_id, limit)
        .then(async (messages) => {
            console.log("Latest messages: ", messages);
            // do ChatGPT stuff
            const formattedMessages = [
                { role: "system", content: `You are going to come up with a helpful response based on the context of the conversation below while pretending to be ${user}.` }
            ];
            
            /* need to format messages for ChatGPT. For example
             * messages: [{ role: "system", content: "You are going to come up with a helpful response." },
                         { role: "user", content: "alice:I want to get better at coding"},
                         { role: "user", content: "bob:I can help you"},,
                         { role: "user", content: "alice:sure, what do you recommend?"},,
                         { role: "user", content: "Come up with a response to alice"},] // the selected user was alice
             */
            messages.forEach(msg => {
                formattedMessages.push({ role: "user", content: `${msg.username}:${msg.text}` });
            });

            formattedMessages.push({ role: "user", content: `Come up with a response to ${username} as if you were writing a text message (no need to write "user: ")` });
            console.log("Formatted messages for ChatGPT: ", formattedMessages);

            try {
                const response = await generateChatResponse(formattedMessages);
                res.json({ response });
            } catch (error) {
                console.error('Error generating chat response:', error);
                res.status(500).json({ error: 'Error generating response' });
            }
        })
        .catch(err => {
            console.error('Error getting latest messages:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

// endpoint to get emotional response
app.get('/chat/:room_id/emotionalresponse', sessionManager.middleware, (req, res) => {
    const room_id = req.params.room_id;
    const emotion = req.query.emotion;
    const limit = 10;
    const username = req.query.username;
    console.log(`Trying to get emotional response: ${emotion}`);

    db.getLatestMessages(room_id, limit)
        .then(async (messages) => {
            // do ChatGPT stuff
            const formattedMessages = [
                { role: "system", content: "You are an emotional chameleon that can pretend to be someone else." },
            ];

            /* need to format messages for ChatGPT. For example
             * messages: [{ role: "system", content: "You are going to come up with a helpful response." },
                         { role: "user", content: "alice:I want to get better at coding"},
                         { role: "user", content: "bob:I can help you"},,
                         { role: "user", content: "alice:sure, what do you recommend?"},,
                         { role: "user", content: "Come up with a response to alice"},] // the selected user was alice
             */
            messages.forEach(msg => {
                formattedMessages.push({ role: "user", content: `${msg.username}:${msg.text}` });
            });

            formattedMessages.push({ role: "system", content: `${username} is feeling ${emotion}.` });
            formattedMessages.push({ role: "user", content: `Pretend you are ${username} and come up with an appropriate response that matches the emotion.` });
            console.log("Formatted messages for ChatGPT: ", formattedMessages);

            try {
                const response = await generateChatResponse(formattedMessages);
                res.json({ response });
            } catch (error) {
                console.error('Error generating chat response:', error);
                res.status(500).json({ error: 'Error generating response' });
            }
        })
        .catch(err => {
            console.error('Error getting latest messages:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

// endpoint to post audio file, make API call to Whisper model, and get translated text
app.post('/voice-to-text', async (req, res) => {
    console.log(req.files);
    if (!req.files || !req.files.audio) {
        return res.status(400).send('No audio file uploaded.');
    }

    const audioFile = req.files.audio;
    const savePath = path.join(__dirname, 'uploads', audioFile.name);

    try {
        await audioFile.mv(savePath);
        const text = await transcribeAudio(savePath);
        res.json({ text });
    } catch (error) {
        console.error('Failed to transcribe audio:', error);
        res.status(500).send('Error processing audio');
    }
     finally {
        fs.unlink(savePath, err => {
            if (err) console.error('Failed to delete audio file:', err);
        });
    }
});

'/app.js', sessionManager.middleware, express.static(path.join(clientApp, 'app.js'));

'/index.html', sessionManager.middleware, express.static(path.join(clientApp, 'index.html'));

'/index', sessionManager.middleware, express.static(path.join(clientApp, 'index'));

'/', sessionManager.middleware, express.static(path.join(clientApp));

app.use((err, req, res, next) => {
    if (err instanceof SessionManager.Error) {
        if (req.headers.accept == 'application/json') {
            res.status(401).send(err);
        } else {
            res.redirect('/login');
        }
    } else {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/profile', sessionManager.middleware, (req, res) => {
    res.json({ username: req.username });
});

app.get('/logout', (req, res) => {
    sessionManager.deleteSession(req);
    res.redirect('/login');
});


function isCorrectPassword(password, saltedHash) {
    const salt = saltedHash.substring(0, 20);
    const originalHash = saltedHash.substring(20);
    const hash = crypto.createHash('sha256').update(password + salt).digest('base64');
    return hash === originalHash;
}

app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

cpen322.connect('http://3.98.223.41/cpen322/test-a5-server.js');
cpen322.export(__filename, { app, db, messages, messageBlockSize, sessionManager, isCorrectPassword , broker });