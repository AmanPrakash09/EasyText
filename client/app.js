function emptyDOM(elem) {
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

function createDOM(htmlString) {
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}

class LobbyView {
    constructor(lobby) {
        this.elem = createDOM(`
            <div class="content">
                <!-- Corresponding content from index.html -->
                <ul class="room-list">
                    <li><a href="#/chat">Room 1</a></li>
                    <li><a href="#/chat">Room 2</a></li>
                    <li><a href="#/chat">Room 3</a></li>
                    <li><a href="#/chat">Room 4</a></li>
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

            this.lobby.addRoom(
                newRoomName + "-id",
                newRoomName
            );

            this.inputElem.value = '';
        });

        this.lobby.onNewRoom = (room) => {
            const listItem = createDOM(`<li><a href="#/chat/${room.id}">${room.name}</a></li>`);
    this.listElem.appendChild(listItem);
        };
    }

    redrawList () {
        emptyDOM(this.listElem);

        for (const roomId in this.lobby.rooms) {
            const room = this.lobby.rooms[roomId];

            const listItem = createDOM(`<li><a href="#/chat/${room.id}">${room.name}</a></li>`);
            this.listElem.appendChild(listItem);
        }
    }
}

class ChatView {
    constructor() {
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
            </div>
        `);

        this.titleElem = this.elem.querySelector('.room-name');
        this.chatElem = this.elem.querySelector('.message-list');
        this.inputElem = this.elem.querySelector('.page-control-input');
        this.buttonElem = this.elem.querySelector('.page-control-btn');
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
    }

    addMessage(username, text) {
        if (!text.trim()) {
            return;
        }

        const message = { username, text };
        this.messages.push(message);
    }
}

class Lobby {
    constructor() {
        this.rooms = {
            room1: new Room('room-1', 'Room 1'),
            room2: new Room('room-2', 'Room 2'),
            room3: new Room('room-3', 'Room 3'),
            room4: new Room('room-4', 'Room 4'),
        };
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

    const lobby = new Lobby();

    const lobbyView = new LobbyView(lobby);
    const chatView = new ChatView();
    const profileView = new ProfileView();

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
            pageView.appendChild(chatView.elem);
        } else if (path === "/profile") {
            pageView.appendChild(profileView.elem);
        }
    }
    
    window.addEventListener('popstate', renderRoute);

    renderRoute();

    cpen322.export(arguments.callee, {
        renderRoute: renderRoute,
        lobbyView: lobbyView,
        chatView: chatView,
        profileView: profileView,
        lobby: lobby
    });
}

window.addEventListener('load', main);
