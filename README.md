<h1>AI Feature Integration for Chat Application</h1>
<h2>Approved Proposal - Description and Justification</h2>
The AI features chosen for our chat application are Facial Emotion Recognition and Generated Responses. Sometimes, things can get lost in translation (textlation) since it is hard to depict another person's emotions or convey your own through text. We wanted to incorporate features that could help users depict emotions better. Originally, we wanted to conduct Sentimental Analysis but realized that from a user's perspective, this would not be very helpful. This is why we chose 2 features: one to capture how the user feels and one to help provide a helpful response to any user in the chat room.
<h3>Facial Emotion Recognition - when it is challenging to convey your emotions</h3>
This feature analyzes the user's facial expressions via their webcam to determine the prevailing emotional state. The application then uses this emotional context to generate a context-aware response by pretending to be the user and reading the chat history.
<h3>Generated Responses - when it is challenging to know what to say to others</h3>
This feature allows the user to single out someone in the chat room, selected a certain number of text messages for context, and then a message is written for them.<br>
<br>
These enhancements aim to create a more intuitive and human-like interaction within conversations, bridging the gap between textual communication and emotional intent.

<h2>Code Submission</h2>
<h3>Code for Facial Emotion Recognition</h3>
<h3>Code for Generated Responses</h3>


<h2>Documentation</h2>
<h3>User Manual</h3>
**Enabling Facial Emotion Recognition**
- Navigate to a chat room<br>
- Click on the "Analyze Emotion" button<br>
- Allow the app to access your webcam<br>
- A video will appear below. Please ensure your face is visible to the webcam<br>
- After a couple of seconds, your face will be tracked and your emotions will be detected<br>
- Click on the video and a response will be generated for you<br><br>
**Enabling Generated Responses**

<h3>Design and Implementation</h3>
**AI Model Choice**<br>
The integration utilizes the face-api.js library for facial emotion recognition and OpenAI for generating responses.

<h2>Setup and Running Guide</h2>
<h3>Dependencies Required</h3>
Here is a list of dependencies along with their versions:<br>
"dotenv": "^16.4.5",<br>
"express": "^4.18.2",<br>
"face-api.js": "^0.22.2",<br>
"mongodb": "^6.4.0",<br>
"openai": "^4.33.0",<br>
"ws": "^8.16.0"<br>
This list can be found inside package.json. Please ensure MongoDB is running on mongodb://127.0.0.1:27017

<h3>API Keys</h3>
There is one API Key for OpenAI. We have sent this key via the Canvas submission.

<h3>Running the Application</h3>
- Clone the repository<br>
- Install dependencies in the root directory of the project: npm install<br>
- Create a .env folder in the root directory of the project<br>
- Set the OpenAI API Key in .env as OPENAI_API_KEY="key" (replace with actual key)<br>
- Start the server: node server<br>
- Open the client application in your browser (http://localhost:3000/)<br>