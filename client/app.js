function emptyDOM(elem) {
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

function createDOM(htmlString) {
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}

class LobbyView {
    constructor() {
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

function main() {
    const lobbyView = new LobbyView();
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
        } else if (path === "/chat") {
            pageView.appendChild(chatView.elem);
        } else if (path === "/profile") {
            pageView.appendChild(profileView.elem);
        }
    }
    
    window.addEventListener('popstate', renderRoute);

    renderRoute();
}

window.addEventListener('load', main);
