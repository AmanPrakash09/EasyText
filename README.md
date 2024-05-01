<h1>EasyText - Chat Application</h1>
<h2>Description and Justification</h2>
The AI features chosen for my chat application suport facial recognition, message generation, and voice-to-text transcription. Sometimes, things can get lost in translation (textlation) as it can be hard to depict another person's emotions or convey your own through text. With EasyText, users can hopefully overcome this hurdle. These enhancements aim to create a more intuitive and human-like interaction within conversations, bridging the gap between textual communication and emotional intent.
<h3>Facial Emotion Recognition - when it is challenging to convey your emotions</h3>
This feature analyzes the user's facial expressions via their webcam to determine their prevailing emotional state. The application then uses this data along with the previous messages to make an API call to OpenAI to generate a context-aware response by pretending to be the user.
<h3>Generated Responses - when it is challenging to know what to say to others</h3>
This feature allows the user to single out someone in the chat room, selected a certain number of text messages for context, and with an API call to OpenAI, a message is written for their selected target.
<h3>Voice to Text - when it can be bothersome to type how you feel</h3>
This feature allows the user to record themselves. This is temporarily turned to an audio file and with an API call to OpenAI's Whisper model, the audio is transcribed to text.

<h2>Documentation</h2>
<h3>User Manual</h3>
<strong>Enabling Facial Emotion Recognition</strong><br>
- Navigate to a chat room<br>
- Click on the "Analyze Emotion" button<br>
- Allow the app to access your webcam<br>
- A video will appear below. Please ensure your face is visible to the webcam<br>
- After a couple of seconds, your face will be tracked and your emotions will be detected<br>
- Click on the video and a response will be generated for you<br><br>
<strong>Enabling Generated Responses</strong><br>
- Navigate to a chat room<br>
- Click on the "Generate Response" button<br>
- Select the user you want to write the message to in the pop-up<br>
- Select the number of previous messages in the pop-up<br>
- Click "Done" and a response will be generated for you<br><br>
<strong>Turning Voice to Text</strong><br>
- Navigate to a chat room<br>
- Click on the "Record Voice" button<br>
- Allow the app to access your microphone<br>
- Speak into your microphone<br>
- Click "Stop Recording" when you are finished speaking and a response will be generated for you

<h3>Design and Implementation</h3>
<strong>AI Model Choice</strong><br>
The integration utilizes the face-api.js library for facial emotion recognition along with OpenAI for generating responses and voice-to-text transcription.

<h2>Setup and Running Guide</h2>
<h3>Dependencies Required</h3>
Here is a list of dependencies along with their versions:<br>
"dotenv": "^16.4.5",<br>
"express": "^4.18.2",<br>
"express-fileupload": "^1.5.0",
"face-api.js": "^0.22.2",<br>
"mongodb": "^6.4.0",<br>
"openai": "^4.33.0",<br>
"ws": "^8.16.0"<br>
This list can be found inside package.json. Please ensure MongoDB is running on mongodb://127.0.0.1:27017

<h3>API Keys</h3>
There is one API Key for OpenAI. You will need your own if you want to use the AI features. Please create a <code>.env</code> file in the project's root directory and paste <code>OPENAI_API_KEY="your API key"</code> within it.

<h3>Running the Application</h3>
- Clone the repository<br>
- Install dependencies in the root directory of the project: npm install<br>
- Create a .env folder in the root directory of the project<br>
- Set the OpenAI API Key in <code>.env</code> as <code>OPENAI_API_KEY="your API key"</code> (replace with actual key)<br>
- Run the command <code>npx webpack --config webpack.config.js</code> if changes made to app.js<br>
- Start the server by typing <code>node server</code> in your console<br>
- Open the client application in your browser (http://localhost:3000/)<br>
