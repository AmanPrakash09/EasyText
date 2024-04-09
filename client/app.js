function emptyDOM(elem) {
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

function createDOM(htmlString) {
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}

function* makeConversationLoader(room) {
    let lastConversationTimestamp = room.creationTimestamp;
    while (room.canLoadConversation) {
        console.log('Attempting to load conversation for room:', room.id);
        room.canLoadConversation = false;
        try {
            yield Service.getLastConversation(room.id, lastConversationTimestamp)
                .then(conversation => {
                    console.log('Conversation fetched:', conversation);
                    if (conversation) {
                        room.addConversation(conversation);
                        lastConversationTimestamp = conversation.timestamp;
                        room.canLoadConversation = true;
                    } else {
                        console.log('No more conversations to load.');
                    }
                })
                .catch(error => {
                    console.error('Error loading conversation:', error);
                    room.canLoadConversation = true;
                });
        } catch (error) {
            console.error('Error loading conversation:', error);
            room.canLoadConversation = true;
        }
        yield new Promise(resolve => setTimeout(resolve, 1000));
    }
}

let profile = {
    username: "Alice"
};

let Service = {
    origin: window.location.origin,
    getAllRooms: function () {
        console.log(`Getting all the rooms from this endpoint: ${this.origin}/chat`);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `${this.origin}/chat`);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error(xhr.responseText));
                    }
                }
            };
            xhr.onerror = function () {
                reject(new Error('Request failed'));
            };

            xhr.send();
        });
    },
    addRoom: function (data) {
        console.log("Trying to add a room to this endpoint: " + `${this.origin}/chat`);
        const { name, image } = data;
        const bodyData = {
            name: name
        };
        if (image) {
            bodyData.image = image;
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${this.origin}/chat`);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(`${xhr.responseText}`));
                }
            };
            xhr.onerror = function () {
                reject(new Error('Request failed'));
            };
            xhr.send(JSON.stringify(bodyData));
        });
    },
    getLastConversation: function (roomId, before) {
        console.log('Client is asking for the last conversation!');
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `${this.origin}/chat/${roomId}/messages?before=${before}`);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error(xhr.responseText));
                    }
                }
            };
            xhr.onerror = function () {
                reject(new Error('Request failed'));
            };
            xhr.send();
        });
    },

    getProfile: function () {
        return new Promise((resolve, reject) => {
            fetch(`${this.origin}/profile`, { credentials: 'include' })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Network response was not ok.');
                    }
                })
                .then(data => {
                    profile.username = data.username;
                    resolve(data);
                })
                .catch(error => reject(error));
        });
    },

    // getting the generated response
    getGeneratedResponse1: function(roomId, limit = 10, username, user) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `${this.origin}/chat/${roomId}/generatedresponse?limit=${limit}&username=${username}&user=${user}`);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error(xhr.responseText));
                    }
                }
            };
            xhr.onerror = function() {
                reject(new Error('Request failed'));
            };
            xhr.send();
        });
    },
    
    // getting a response based on the user's emotional state
    getEmotionalResponse: function(roomId, emotion, username) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = `${this.origin}/chat/${roomId}/emotionalresponse?emotion=${emotion}&username=${username}`;
            xhr.open('GET', url);

            xhr.onload = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error(xhr.responseText));
                    }
                }
            };
            xhr.onerror = function() {
                reject(new Error('Network request for emotional response failed'));
            };
            xhr.send();
        });
    },

};

class LobbyView {
    constructor(lobby) {
        this.elem = createDOM(`
            <div class="content">
                <!-- Corresponding content from index.html -->
                <ul class="room-list">
                    // <li><a href="#/chat">Room 1</a></li>
                    // <li><a href="#/chat">Room 2</a></li>
                    // <li><a href="#/chat">Room 3</a></li>
                    // <li><a href="#/chat">Room 4</a></li>
                </ul>
                <div class="page-control">
                    <input type="text" class="page-control-input" placeholder="New room name">
                    <button class="page-control-btn">Create Room</button>
                </div>
            </div>
        `);

        this.listElem = this.elem.querySelector('.room-list');
        this.inputElem = this.elem.querySelector('.page-control-input');
        this.buttonElem = this.elem.querySelector('.page-control-btn');

        this.lobby = lobby;

        this.redrawList();

        this.buttonElem.addEventListener('click', () => {
            const newRoomName = this.inputElem.value.trim();
            const newRoomImage = 'assets/everyone-icon.png';

            Service.addRoom({
                name: newRoomName,
                image: newRoomImage
            })
                .then(newRoom => {
                    this.lobby.addRoom(newRoom.id, newRoom.name, newRoom.image);
                    this.inputElem.value = '';
                })
                .catch(error => {
                    console.error('Error adding room:', error);
                    const errorMessage = document.createElement('div');
                    errorMessage.textContent = `Error adding room: ${error.message}`;
                    errorMessage.classList.add('error-message');
                    this.elem.appendChild(errorMessage);
                });
        });

        this.lobby.onNewRoom = (room) => {
            const listItem = createDOM(`<li><a href="#/chat/${room.id}">${room.name}</a></li>`);
            this.listElem.appendChild(listItem);
        };
    }

    redrawList() {
        emptyDOM(this.listElem);

        for (const roomId in this.lobby.rooms) {
            const room = this.lobby.rooms[roomId];

            const listItem = createDOM(`<li><a href="#/chat/${room.id}">${room.name}</a></li>`);
            this.listElem.appendChild(listItem);
        }
    }
}

function sanitizeString(str) {
    return str.replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;')
              .replace(/&(?!(amp;|lt;|gt;|quot;|apos;|#039;))/g, '&amp;');
}


class ChatView {
    constructor(socket) {
        this.elem = createDOM(`
            <div class="content">
                <!-- Corresponding content from chat.html -->
                <h4 class="room-name">Chat Room Title</h4>
                <div class="message-list">
                    <div class="message">
                        <span class="message-user">Alice:</span>
                        <span class="message-text">Hi there!</span>
                    </div>
                    <div class="message my-message">
                        <span class="message-user">Bob:</span>
                        <span class="message-text">Hello!</span>
                    </div>
                    <!-- More messages will go here -->
                </div>
                <div class="page-control">
                    <textarea class="page-control-input" placeholder="Type your message here..."></textarea>
                    <button class="page-control-btn">Send</button>
                </div>
                <div>
                    <button class="show-gen-form">Generate Response</button>
                </div>
                <div class="video-container">
                    <video class="video" width="720" height="560" autoplay muted></video>
                    <button class="startFacialRecognition">Analyze Emotion</button>
                </div>
            </div>
        `);



        this.titleElem = this.elem.querySelector('.room-name');
        this.chatElem = this.elem.querySelector('.message-list');
        this.inputElem = this.elem.querySelector('.page-control-input');
        this.buttonElem = this.elem.querySelector('.page-control-btn');

        this.room = null;

        this.buttonElem.addEventListener('click', () => this.sendMessage());

        this.inputElem.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                this.sendMessage();
            }
        });

        this.socket = socket;

        this.chatElem.addEventListener('wheel', (event) => {
            if (event.deltaY < 0 && this.chatElem.scrollTop === 0 && this.room.canLoadConversation) {
                this.room.getLastConversation.next();
            }
        });
        
        // create a container for the popup
        this.formPopupContainer = document.createElement('div');
        this.formPopupContainer.style.display = 'none';
        this.formPopupContainer.style.position = 'fixed';
        this.formPopupContainer.style.left = '50%';
        this.formPopupContainer.style.top = '50%';
        this.formPopupContainer.style.transform = 'translate(-50%, -50%)';
        this.formPopupContainer.style.border = '1px solid #ccc';
        this.formPopupContainer.style.backgroundColor = '#fff';
        this.formPopupContainer.style.padding = '20px';
        this.formPopupContainer.style.zIndex = '1000';
        document.body.appendChild(this.formPopupContainer);
        
        // adding button here so that user can select any other user in the chatroom along with a number of messages for the generated response
        this.generateResponseButton = this.elem.querySelector('.show-gen-form');
        this.generateResponseButton.addEventListener('click', () => this.showGenerateResponseForm());
        
        // these are elements for the face recognition part
        this.videoElem = this.elem.querySelector('.video');
        this.videoElem.style.display = 'none';
        this.startFacialRecognitionButton = this.elem.querySelector('.startFacialRecognition');
        this.finalFacialEmotion = null;
        
        this.startFacialRecognitionButton.addEventListener('click', () => this.initializeAndStartFacialRecognition());
    }

    initializeAndStartFacialRecognition() {
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('../models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('../models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('../models'),
            faceapi.nets.faceExpressionNet.loadFromUri('../models')
        ]).then(() => this.startFacialRecognition())
        .catch(error => {
            console.error("Model loading failed:", error);
        });
    }
    
    startFacialRecognition() {
        const video = this.videoElem;
        video.style.display = 'block';
    
        video.onloadeddata = () => {
            console.log('Video data has loaded.');
            this.initializeCanvasAndDetections();
        };
    
        navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();
        })
        .catch(err => console.error(err));
    }
    
    initializeCanvasAndDetections() {
        if (faceapi) {
            const video = this.videoElem;
            const canvas = faceapi.createCanvasFromMedia(video);
            canvas.addEventListener('click', () => this.closeVideo());
            const canvasContainer = this.elem.querySelector('.video-container');
            canvasContainer.append(canvas);
            this.canvas = canvas;
            const displaySize = { width: video.width, height: video.height };
            faceapi.matchDimensions(canvas, displaySize);
            this.detectionInterval = setInterval(async () => {
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                                                 .withFaceLandmarks()
                                                 .withFaceExpressions();
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                faceapi.draw.drawDetections(canvas, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
                if (detections.length > 0 && detections[0].expressions) {
                    this.finalFacialEmotion = detections[0].expressions.asSortedArray()[0].expression;
                }
                console.log(detections);
            }, 10);
        } else {
            console.error('faceapi is not defined');
        }
    }
    
    closeVideo() {
        if (this.videoElem.srcObject) {
            const tracks = this.videoElem.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.videoElem.srcObject = null;
        }
        this.videoElem.style.display = 'none';
    
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
    
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        console.log("Final Emotion: ", this.finalFacialEmotion);
        this.getEmotionalResponse();
    }
    
    // this method will get a generated response based on the user's emotion
    getEmotionalResponse() {
        if (!this.finalFacialEmotion || !this.room) {
            console.error("Emotion or room not set for the ChatView instance.");
            return;
        }
        
        Service.getProfile()
            .then(() => {
                console.log('Profile:', profile);
            })
            .catch(error => console.error('Error fetching profile:', error));
        
        const roomId = this.room.id;
        const emotion = this.finalFacialEmotion;
        Service.getEmotionalResponse(roomId, emotion, profile.username)
            .then(response => {
                console.log('Emotional Response:', response);
                this.inputElem.value = response.response;
            })
            .catch(error => {
                console.error('Error getting emotional response:', error);
            });
    }
    
    // this method will show the pop-up form to get data for the generated response
    showGenerateResponseForm() {
        this.formPopupContainer.innerHTML = '';
    
        // form title
        const formTitle = document.createElement('h3');
        formTitle.textContent = 'Please select a user:';
        this.formPopupContainer.appendChild(formTitle);
    
        const usersList = document.createElement('form');
        usersList.setAttribute('id', 'usersListForm');
        this.formPopupContainer.appendChild(usersList);
    
        // will fetch and show users
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${Service.origin}/users`);
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const users = JSON.parse(xhr.responseText);
                users.forEach(user => {
                    const userLabel = document.createElement('label');
                    userLabel.textContent = user.username;
                    userLabel.classList.add('user-label');
    
                    const userRadioButton = document.createElement('input');
                    userRadioButton.setAttribute('type', 'radio');
                    userRadioButton.setAttribute('name', 'userSelection');
                    userRadioButton.value = user.username;
                    userRadioButton.classList.add('user-radio');
    
                    usersList.appendChild(userRadioButton);
                    usersList.appendChild(userLabel);
                    usersList.appendChild(document.createElement('br'));
                });
            } else {
                console.error('Failed to fetch users:', xhr.responseText);
            }
        };
        xhr.onerror = () => console.error('Error fetching users');
        xhr.send();
    
        // container for the number of messages input
        const messagesInputContainer = document.createElement('div');
        messagesInputContainer.classList.add('input-container');
        this.formPopupContainer.appendChild(messagesInputContainer);
    
        const messagesQuestion = document.createElement('h3');
        messagesQuestion.textContent = 'How many messages would you like to take into consideration for the response?';
        messagesInputContainer.appendChild(messagesQuestion);
    
        const messagesInput = document.createElement('input');
        messagesInput.setAttribute('type', 'number');
        messagesInput.setAttribute('min', '1');
        messagesInput.setAttribute('id', 'numMessages');
        messagesInput.required = true;
        messagesInputContainer.appendChild(messagesInput);
    
        // container for the button
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        this.formPopupContainer.appendChild(buttonContainer);
    
        const doneButton = document.createElement('button');
        doneButton.textContent = 'Done';
        doneButton.type = 'button';
        doneButton.classList.add('done-btn');
        doneButton.addEventListener('click', () => {
            const selectedUser = document.querySelector('input[name="userSelection"]:checked');
            const numMessages = document.getElementById('numMessages').value;
    
            if (!selectedUser) {
                alert('Please select a user.');
                return;
            }
    
            if (!numMessages) {
                alert('Please enter a number of messages.');
                return;
            }
            
            if (numMessages < 1) {
                alert('Please enter a number greater than 0.');
                numMessagesInput.focus();
                return;
            }
    
            console.log('Selected user:', selectedUser);
            console.log('Number of messages:', numMessages);
            this.getGeneratedResponse(selectedUser.value, numMessages);
    
            this.formPopupContainer.style.display = 'none';
        });
        buttonContainer.appendChild(doneButton);
    
        this.formPopupContainer.style.display = 'block';
    }
    
    // puts the generated response in the message box
    getGeneratedResponse(selectedUser,numberOfMessages) {
        if (!this.room) {
            console.error("No room set for the ChatView instance.");
            return;
        }
        
        Service.getProfile()
            .then(() => {
                console.log('Profile:', profile);
            })
            .catch(error => console.error('Error fetching profile:', error));
        
        console.log('Number of messages in room:', this.room.messages.length);
    
        let lastMessageTimestamp;
        if (this.room.messages.length > 0) {
            const lastMessage = this.room.messages[this.room.messages.length - 1];
            lastMessageTimestamp = lastMessage.timestamp;
    
            console.log('Timestamp of the last message:', lastMessageTimestamp);
    
            if (!lastMessageTimestamp) {
                console.log('Last message has no timestamp. Using current time.');
                lastMessageTimestamp = Date.now();
            }
        } else {
            console.log('No messages in room. Using current time.');
            lastMessageTimestamp = Date.now();
        }
    
        Service.getGeneratedResponse1(this.room.id, numberOfMessages, selectedUser, profile.username)
            .then(message => {
                console.log('Generated Response:', message);
                this.inputElem.value = message.response;
            })
            .catch(error => {
                console.error('Error getting generated response:', error);
            });
    }
        
    sendMessage() {
        const newMessage = this.inputElem.value.trim();

        if (newMessage) {
            this.room.addMessage(profile.username, newMessage);
            this.inputElem.value = '';
        }

        const message = {
            roomId: this.room.id,
            username: profile.username,
            text: newMessage
        };
        this.socket.send(JSON.stringify(message));
    }

    setRoom(room) {
        console.log("Setting room:", room);

        this.room = room;
        this.titleElem.textContent = room.name;

        emptyDOM(this.chatElem);

        console.log("Order of messages in room.messages:", room.messages);

        room.messages.forEach(message => {
            console.log("Adding message to chat:", message);
            this.addMessageToChat(message);
        });

        this.room.onNewMessage = (message) => {
            console.log("New message received:", message);
            this.addMessageToChat(message);
        };

        room.onFetchConversation = (conversation) => {
            const hb = this.chatElem.scrollHeight;
            conversation.messages.slice().reverse().forEach(message => {
                this.addMessageToChat(message, true);
            });
    
            let ha = this.chatElem.scrollHeight;
            this.chatElem.scrollTo(0, ha - hb);
        };
        
        room.getLastConversation = makeConversationLoader(room);
        room.getLastConversation.next();
    }

    addMessageToChat(message, prepend = false) {
        message.text = sanitizeString(message.text);
        const messageElem = createDOM(`<div class="message${message.username === profile.username ? ' my-message' : ''}">
            <span class="message-user">${message.username}</span>
            <span class="message-text">${message.text}</span>
        </div>`);
        if (prepend) {
            this.chatElem.insertBefore(messageElem, this.chatElem.firstChild);
        } else {
            this.chatElem.appendChild(messageElem);
        }
    }
}

class ProfileView {
    constructor() {
        this.elem = createDOM(`
            <div class="content">
                <!-- Corresponding content from profile.html -->
                <div class="profile-form">
                    <div class="form-field">
                        <label for="username">Username:</label>
                        <input type="text" id="username">
                    </div>
                    <div class="form-field">
                        <label for="password">Password:</label>
                        <input type="password" id="password">
                    </div>
                    <div class="form-field">
                        <label for="avatar">Avatar:</label>
                        <input type="file" id="avatar">
                    </div>
                    <div class="form-field">
                        <label for="about">About:</label>
                        <textarea id="about" placeholder="Tell us about yourself..."></textarea>
                    </div>
                </div>
                <div class="page-control">
                    <button class="page-control-btn">Save Changes</button>
                </div>
            </div>
        `);
    }
}

class Room {
    constructor(id, name, image = 'assets/everyone-icon.png', messages = []) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.messages = messages;
        this.creationTimestamp = Date.now();
        this.getLastConversation = makeConversationLoader(this);
        this.canLoadConversation = true;
    }

    addConversation(conversation) {
        this.messages.unshift(...conversation.messages);
        if (this.onFetchConversation) {
            this.onFetchConversation(conversation);
        }
    }


    addMessage(username, text) {
        if (!text.trim()) {
            return;
        }

        console.log(`Adding message to ${this.name} room:`, { username, text });

        const message = { username, text };
        this.messages.push(message);

        if (this.onNewMessage) {
            this.onNewMessage(message);
        }
    }
}

class Lobby {
    constructor() {
        this.rooms = {};
        this.onNewRoom = null;
    }

    getRoom(roomId) {
        return this.rooms[roomId] || null;
    }

    addRoom(id, name, image, messages) {
        this.rooms[id] = new Room(id, name, image, messages);

        if (this.onNewRoom) {
            this.onNewRoom(this.rooms[id]);
        }
    }
}

function main() {

    const socket = new WebSocket('ws://localhost:8000');

    socket.addEventListener('message', event => {
        const message = JSON.parse(event.data);
        const room = lobby.getRoom(message.roomId);
        if (room) {
            room.addMessage(message.username, message.text);
        }
    });

    const lobby = new Lobby();

    const lobbyView = new LobbyView(lobby);
    const chatView = new ChatView(socket);
    const profileView = new ProfileView();

    function refreshLobby() {
        Service.getAllRooms()
            .then(rooms => {
                for (const room of rooms) {
                    if (lobby.rooms[room.id]) {
                        lobby.rooms[room.id].name = room.name;
                        lobby.rooms[room.id].image = room.image;
                        lobby.rooms[room.id].messages = room.messages;
                    } else {
                        lobby.addRoom(room.id, room.name, room.image, room.messages);
                    }
                }
            })
            .catch(error => {
                console.error("Error refreshing the lobby: " + error);
            });
    }

    refreshLobby();

    setInterval(refreshLobby, 60000);

    function extractRoomIdFromPath(hash) {
        const match = hash.match(/\/chat\/(room-\d+)/);
        return match ? match[1] : null;
    }

    Service.getProfile()
        .then(() => {
            console.log('Profile updated:', profile);
        })
        .catch(error => console.error('Error fetching profile:', error));
    

    function renderRoute() {
        console.log("Current path:", window.location.hash.substring(1));

        const path = window.location.hash.substring(1);
        console.log("Path extracted from URL:", path);

        const pageView = document.getElementById('page-view');

        console.log("Page View Element:", pageView);

        emptyDOM(pageView);

        if (path == "" || path === "/") {
            pageView.appendChild(lobbyView.elem);
        } else if (path.startsWith("/chat")) {
            console.log("Path before extracting room ID:", path);
            const parts = path.split('/');
            console.log("Parts array:", parts);
            // not working parts[2] does not work after refreshing the page
            const roomId = extractRoomIdFromPath(window.location.hash);
            console.log("Rooms in the lobby:", Object.keys(lobby.rooms));

            if (roomId) {
                Service.getAllRooms().then(rooms => {
                    lobby.rooms = {};
                    rooms.forEach(roomData => {
                        lobby.addRoom(roomData.id, roomData.name, roomData.image, roomData.messages);
                    });
                    lobbyView.redrawList();
                    
                    const room = lobby.getRoom(roomId);
                    if (room) {
                        chatView.setRoom(room);
                        pageView.appendChild(chatView.elem);
                    } else {
                        console.error("Room not found");
                    }
                }).catch(error => {
                    console.error("Error fetching rooms:", error);
                });
            }
        } else if (path === "/profile") {
            pageView.appendChild(profileView.elem);
        }
    }

    window.addEventListener('popstate', renderRoute);

    renderRoute();
    
    // cpen322.export(arguments.callee, {
    //     refreshLobby: refreshLobby,
    //     lobby: lobby,
    //     socket: socket,
    //     chatView: chatView
    // });

    // cpen322.setDefault("testRoomId", "room-1");
    // cpen322.setDefault("cookieName", "cpen322-session");
    // cpen322.setDefault("image", "assets/everyone-icon.png");
    // cpen322.setDefault("webSocketServer", "ws://localhost:8000");
}

window.addEventListener('load', main);
