(()=>{function e(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function t(e){let t=document.createElement("template");return t.innerHTML=e.trim(),t.content.firstChild}function*o(e){let t=e.creationTimestamp;for(;e.canLoadConversation;){console.log("Attempting to load conversation for room:",e.id),e.canLoadConversation=!1;try{yield n.getLastConversation(e.id,t).then((o=>{console.log("Conversation fetched:",o),o?(e.addConversation(o),t=o.timestamp,e.canLoadConversation=!0):console.log("No more conversations to load.")})).catch((t=>{console.error("Error loading conversation:",t),e.canLoadConversation=!0}))}catch(t){console.error("Error loading conversation:",t),e.canLoadConversation=!0}yield new Promise((e=>setTimeout(e,1e3)))}}let s={username:"Alice"},n={origin:window.location.origin,getAllRooms:function(){return console.log(`Getting all the rooms from this endpoint: ${this.origin}/chat`),new Promise(((e,t)=>{const o=new XMLHttpRequest;o.open("GET",`${this.origin}/chat`),o.onreadystatechange=function(){4===o.readyState&&(200===o.status?e(JSON.parse(o.responseText)):t(new Error(o.responseText)))},o.onerror=function(){t(new Error("Request failed"))},o.send()}))},addRoom:function(e){console.log(`Trying to add a room to this endpoint: ${this.origin}/chat`);const{name:t,image:o}=e,s={name:t};return o&&(s.image=o),new Promise(((e,t)=>{const o=new XMLHttpRequest;o.open("POST",`${this.origin}/chat`),o.setRequestHeader("Content-Type","application/json"),o.onload=function(){o.status>=200&&o.status<300?e(JSON.parse(o.responseText)):t(new Error(`${o.responseText}`))},o.onerror=function(){t(new Error("Request failed"))},o.send(JSON.stringify(s))}))},getLastConversation:function(e,t){return console.log("Client is asking for the last conversation!"),new Promise(((o,s)=>{const n=new XMLHttpRequest;n.open("GET",`${this.origin}/chat/${e}/messages?before=${t}`),n.onreadystatechange=function(){4===n.readyState&&(200===n.status?o(JSON.parse(n.responseText)):s(new Error(n.responseText)))},n.onerror=function(){s(new Error("Request failed"))},n.send()}))},getProfile:function(){return new Promise(((e,t)=>{fetch(`${this.origin}/profile`,{credentials:"include"}).then((e=>{if(e.ok)return e.json();throw new Error("Network response was not ok.")})).then((t=>{s.username=t.username,e(t)})).catch((e=>t(e)))}))},getGeneratedResponse1:function(e,t=10,o){return new Promise(((s,n)=>{const a=new XMLHttpRequest;a.open("GET",`${this.origin}/chat/${e}/generatedresponse?limit=${t}&username=${o}`),a.onreadystatechange=function(){4===a.readyState&&(200===a.status?s(JSON.parse(a.responseText)):n(new Error(a.responseText)))},a.onerror=function(){n(new Error("Request failed"))},a.send()}))},getEmotionalResponse:function(e,t,o=10){return new Promise(((o,s)=>{const n=new XMLHttpRequest,a=`${this.origin}/chat/${e}/emotionalresponse?emotion=${t}`;n.open("GET",a),n.onload=function(){4===n.readyState&&(200===n.status?o(JSON.parse(n.responseText)):s(new Error(n.responseText)))},n.onerror=function(){s(new Error("Network request for emotional response failed"))},n.send()}))}};class a{constructor(e){this.elem=t('\n            <div class="content">\n                \x3c!-- Corresponding content from index.html --\x3e\n                <ul class="room-list">\n                    // <li><a href="#/chat">Room 1</a></li>\n                    // <li><a href="#/chat">Room 2</a></li>\n                    // <li><a href="#/chat">Room 3</a></li>\n                    // <li><a href="#/chat">Room 4</a></li>\n                </ul>\n                <div class="page-control">\n                    <input type="text" class="page-control-input" placeholder="New room name">\n                    <button class="page-control-btn">Create Room</button>\n                </div>\n            </div>\n        '),this.listElem=this.elem.querySelector(".room-list"),this.inputElem=this.elem.querySelector(".page-control-input"),this.buttonElem=this.elem.querySelector(".page-control-btn"),this.lobby=e,this.redrawList(),this.buttonElem.addEventListener("click",(()=>{const e=this.inputElem.value.trim();n.addRoom({name:e,image:"assets/everyone-icon.png"}).then((e=>{this.lobby.addRoom(e.id,e.name,e.image),this.inputElem.value=""})).catch((e=>{console.error("Error adding room:",e);const t=document.createElement("div");t.textContent=`Error adding room: ${e.message}`,t.classList.add("error-message"),this.elem.appendChild(t)}))})),this.lobby.onNewRoom=e=>{const o=t(`<li><a href="#/chat/${e.id}">${e.name}</a></li>`);this.listElem.appendChild(o)}}redrawList(){e(this.listElem);for(const e in this.lobby.rooms){const o=this.lobby.rooms[e],s=t(`<li><a href="#/chat/${o.id}">${o.name}</a></li>`);this.listElem.appendChild(s)}}}class i{constructor(e){this.elem=t('\n            <div class="content">\n                \x3c!-- Corresponding content from chat.html --\x3e\n                <h4 class="room-name">Chat Room Title</h4>\n                <div class="message-list">\n                    <div class="message">\n                        <span class="message-user">Alice:</span>\n                        <span class="message-text">Hi there!</span>\n                    </div>\n                    <div class="message my-message">\n                        <span class="message-user">Bob:</span>\n                        <span class="message-text">Hello!</span>\n                    </div>\n                    \x3c!-- More messages will go here --\x3e\n                </div>\n                <div class="page-control">\n                    <textarea class="page-control-input" placeholder="Type your message here..."></textarea>\n                    <button class="page-control-btn">Send</button>\n                </div>\n                <div>\n                    <button class="show-gen-form">Generate Response</button>\n                </div>\n                <div class="video-container">\n                    <video class="video" width="720" height="560" autoplay muted></video>\n                    <button class="startFacialRecognition">Analyze Emotion</button>\n                </div>\n            </div>\n        '),this.titleElem=this.elem.querySelector(".room-name"),this.chatElem=this.elem.querySelector(".message-list"),this.inputElem=this.elem.querySelector(".page-control-input"),this.buttonElem=this.elem.querySelector(".page-control-btn"),this.room=null,this.buttonElem.addEventListener("click",(()=>this.sendMessage())),this.inputElem.addEventListener("keyup",(e=>{"Enter"!==e.key||e.shiftKey||this.sendMessage()})),this.socket=e,this.chatElem.addEventListener("wheel",(e=>{e.deltaY<0&&0===this.chatElem.scrollTop&&this.room.canLoadConversation&&this.room.getLastConversation.next()})),this.formPopupContainer=document.createElement("div"),this.formPopupContainer.style.display="none",this.formPopupContainer.style.position="fixed",this.formPopupContainer.style.left="50%",this.formPopupContainer.style.top="50%",this.formPopupContainer.style.transform="translate(-50%, -50%)",this.formPopupContainer.style.border="1px solid #ccc",this.formPopupContainer.style.backgroundColor="#fff",this.formPopupContainer.style.padding="20px",this.formPopupContainer.style.zIndex="1000",document.body.appendChild(this.formPopupContainer),this.generateResponseButton=this.elem.querySelector(".show-gen-form"),this.generateResponseButton.addEventListener("click",(()=>this.showGenerateResponseForm())),this.videoElem=this.elem.querySelector(".video"),this.videoElem.style.display="none",this.startFacialRecognitionButton=this.elem.querySelector(".startFacialRecognition"),this.finalFacialEmotion=null,this.startFacialRecognitionButton.addEventListener("click",(()=>this.initializeAndStartFacialRecognition()))}initializeAndStartFacialRecognition(){Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri("../models"),faceapi.nets.faceLandmark68Net.loadFromUri("../models"),faceapi.nets.faceRecognitionNet.loadFromUri("../models"),faceapi.nets.faceExpressionNet.loadFromUri("../models")]).then((()=>this.startFacialRecognition())).catch((e=>{console.error("Model loading failed:",e)}))}startFacialRecognition(){const e=this.videoElem;e.style.display="block",e.onloadeddata=()=>{console.log("Video data has loaded."),this.initializeCanvasAndDetections()},navigator.mediaDevices.getUserMedia({video:!0}).then((t=>{e.srcObject=t,e.play()})).catch((e=>console.error(e)))}initializeCanvasAndDetections(){if(faceapi){const e=this.videoElem,t=faceapi.createCanvasFromMedia(e);t.addEventListener("click",(()=>this.closeVideo())),this.elem.querySelector(".video-container").append(t),this.canvas=t;const o={width:e.width,height:e.height};faceapi.matchDimensions(t,o),this.detectionInterval=setInterval((async()=>{const s=await faceapi.detectAllFaces(e,new faceapi.TinyFaceDetectorOptions).withFaceLandmarks().withFaceExpressions(),n=faceapi.resizeResults(s,o);t.getContext("2d").clearRect(0,0,t.width,t.height),faceapi.draw.drawDetections(t,n),faceapi.draw.drawFaceLandmarks(t,n),faceapi.draw.drawFaceExpressions(t,n),s.length>0&&s[0].expressions&&(this.finalFacialEmotion=s[0].expressions.asSortedArray()[0].expression),console.log(s)}),10)}else console.error("faceapi is not defined")}closeVideo(){this.videoElem.srcObject&&(this.videoElem.srcObject.getTracks().forEach((e=>e.stop())),this.videoElem.srcObject=null),this.videoElem.style.display="none",this.canvas&&(this.canvas.remove(),this.canvas=null),this.detectionInterval&&(clearInterval(this.detectionInterval),this.detectionInterval=null),console.log("Final Emotion: ",this.finalFacialEmotion),this.getEmotionalResponse()}getEmotionalResponse(){if(!this.finalFacialEmotion||!this.room)return void console.error("Emotion or room not set for the ChatView instance.");const e=this.room.id,t=this.finalFacialEmotion;n.getEmotionalResponse(e,t).then((e=>{console.log("Emotional Response:",e)})).catch((e=>{console.error("Error getting emotional response:",e)}))}showGenerateResponseForm(){this.formPopupContainer.innerHTML="";const e=document.createElement("h3");e.textContent="Please select a user:",this.formPopupContainer.appendChild(e);const t=document.createElement("form");t.setAttribute("id","usersListForm"),this.formPopupContainer.appendChild(t);const o=new XMLHttpRequest;o.open("GET",`${n.origin}/users`),o.onload=()=>{o.status>=200&&o.status<300?JSON.parse(o.responseText).forEach((e=>{const o=document.createElement("label");o.textContent=e.username,o.classList.add("user-label");const s=document.createElement("input");s.setAttribute("type","radio"),s.setAttribute("name","userSelection"),s.value=e.username,s.classList.add("user-radio"),t.appendChild(s),t.appendChild(o),t.appendChild(document.createElement("br"))})):console.error("Failed to fetch users:",o.responseText)},o.onerror=()=>console.error("Error fetching users"),o.send();const s=document.createElement("div");s.classList.add("input-container"),this.formPopupContainer.appendChild(s);const a=document.createElement("h3");a.textContent="How many messages would you like to take into consideration for the response?",s.appendChild(a);const i=document.createElement("input");i.setAttribute("type","number"),i.setAttribute("min","1"),i.setAttribute("id","numMessages"),i.required=!0,s.appendChild(i);const r=document.createElement("div");r.classList.add("button-container"),this.formPopupContainer.appendChild(r);const l=document.createElement("button");l.textContent="Done",l.type="button",l.classList.add("done-btn"),l.addEventListener("click",(()=>{const e=document.querySelector('input[name="userSelection"]:checked'),t=document.getElementById("numMessages").value;if(e)if(t){if(t<1)return alert("Please enter a number greater than 0."),void numMessagesInput.focus();console.log("Selected user:",e),console.log("Number of messages:",t),this.getGeneratedResponse(e.value,t),this.formPopupContainer.style.display="none"}else alert("Please enter a number of messages.");else alert("Please select a user.")})),r.appendChild(l),this.formPopupContainer.style.display="block"}getGeneratedResponse(e,t){if(!this.room)return void console.error("No room set for the ChatView instance.");let o;console.log("Number of messages in room:",this.room.messages.length),this.room.messages.length>0?(o=this.room.messages[this.room.messages.length-1].timestamp,console.log("Timestamp of the last message:",o),o||(console.log("Last message has no timestamp. Using current time."),o=Date.now())):(console.log("No messages in room. Using current time."),o=Date.now()),n.getGeneratedResponse1(this.room.id,t,e).then((e=>{console.log("Generated Response:",e),this.inputElem.value=e.response})).catch((e=>{console.error("Error getting generated response:",e)}))}sendMessage(){const e=this.inputElem.value.trim();e&&(this.room.addMessage(s.username,e),this.inputElem.value="");const t={roomId:this.room.id,username:s.username,text:e};this.socket.send(JSON.stringify(t))}setRoom(t){console.log("Setting room:",t),this.room=t,this.titleElem.textContent=t.name,e(this.chatElem),console.log("Order of messages in room.messages:",t.messages),t.messages.forEach((e=>{console.log("Adding message to chat:",e),this.addMessageToChat(e)})),this.room.onNewMessage=e=>{console.log("New message received:",e),this.addMessageToChat(e)},t.onFetchConversation=e=>{const t=this.chatElem.scrollHeight;e.messages.slice().reverse().forEach((e=>{this.addMessageToChat(e,!0)}));let o=this.chatElem.scrollHeight;this.chatElem.scrollTo(0,o-t)},t.getLastConversation=o(t),t.getLastConversation.next()}addMessageToChat(e,o=!1){e.text=e.text.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;").replace(/&(?!(amp;|lt;|gt;|quot;|apos;|#039;))/g,"&amp;");const n=t(`<div class="message${e.username===s.username?" my-message":""}">\n            <span class="message-user">${e.username}</span>\n            <span class="message-text">${e.text}</span>\n        </div>`);o?this.chatElem.insertBefore(n,this.chatElem.firstChild):this.chatElem.appendChild(n)}}class r{constructor(){this.elem=t('\n            <div class="content">\n                \x3c!-- Corresponding content from profile.html --\x3e\n                <div class="profile-form">\n                    <div class="form-field">\n                        <label for="username">Username:</label>\n                        <input type="text" id="username">\n                    </div>\n                    <div class="form-field">\n                        <label for="password">Password:</label>\n                        <input type="password" id="password">\n                    </div>\n                    <div class="form-field">\n                        <label for="avatar">Avatar:</label>\n                        <input type="file" id="avatar">\n                    </div>\n                    <div class="form-field">\n                        <label for="about">About:</label>\n                        <textarea id="about" placeholder="Tell us about yourself..."></textarea>\n                    </div>\n                </div>\n                <div class="page-control">\n                    <button class="page-control-btn">Save Changes</button>\n                </div>\n            </div>\n        ')}}class l{constructor(e,t,s="assets/everyone-icon.png",n=[]){this.id=e,this.name=t,this.image=s,this.messages=n,this.creationTimestamp=Date.now(),this.getLastConversation=o(this),this.canLoadConversation=!0}addConversation(e){this.messages.unshift(...e.messages),this.onFetchConversation&&this.onFetchConversation(e)}addMessage(e,t){if(!t.trim())return;console.log(`Adding message to ${this.name} room:`,{username:e,text:t});const o={username:e,text:t};this.messages.push(o),this.onNewMessage&&this.onNewMessage(o)}}class c{constructor(){this.rooms={},this.onNewRoom=null}getRoom(e){return this.rooms[e]||null}addRoom(e,t,o,s){this.rooms[e]=new l(e,t,o,s),this.onNewRoom&&this.onNewRoom(this.rooms[e])}}window.addEventListener("load",(function(){const t=new WebSocket("ws://localhost:8000");t.addEventListener("message",(e=>{const t=JSON.parse(e.data),s=o.getRoom(t.roomId);s&&s.addMessage(t.username,t.text)}));const o=new c,l=new a(o),d=new i(t),m=new r;function h(){n.getAllRooms().then((e=>{for(const t of e)o.rooms[t.id]?(o.rooms[t.id].name=t.name,o.rooms[t.id].image=t.image,o.rooms[t.id].messages=t.messages):o.addRoom(t.id,t.name,t.image,t.messages)})).catch((e=>{console.error("Error refreshing the lobby: "+e)}))}function p(){console.log("Current path:",window.location.hash.substring(1));const t=window.location.hash.substring(1);console.log("Path extracted from URL:",t);const s=document.getElementById("page-view");if(console.log("Page View Element:",s),e(s),""==t||"/"===t)s.appendChild(l.elem);else if(t.startsWith("/chat")){console.log("Path before extracting room ID:",t);const e=t.split("/");console.log("Parts array:",e);const a=function(e){const t=window.location.hash.match(/\/chat\/(room-\d+)/);return t?t[1]:null}();console.log("Rooms in the lobby:",Object.keys(o.rooms)),a&&n.getAllRooms().then((e=>{o.rooms={},e.forEach((e=>{o.addRoom(e.id,e.name,e.image,e.messages)})),l.redrawList();const t=o.getRoom(a);t?(d.setRoom(t),s.appendChild(d.elem)):console.error("Room not found")})).catch((e=>{console.error("Error fetching rooms:",e)}))}else"/profile"===t&&s.appendChild(m.elem)}h(),setInterval(h,6e4),n.getProfile().then((()=>{console.log("Profile updated:",s)})).catch((e=>console.error("Error fetching profile:",e))),window.addEventListener("popstate",p),p()}))})();