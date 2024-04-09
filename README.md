<h1>AI Feature Integration for Chat Application</h1>
<h2>Approved Proposal</h2>

<h2>Code Submission</h2>

<h2>Documentation</h2>
<h3>User Manual</h3>

<h3>Design and Implementation</h3>

<h2>Setup and Running Guide</h2>
<h3>Dependencies Required</h3>
Here is a list of dependencies along with their versions:
"dotenv": "^16.4.5",
"express": "^4.18.2",
"face-api.js": "^0.22.2",
"mongodb": "^6.4.0",
"openai": "^4.33.0",
"ws": "^8.16.0"
This list can be found inside package.json. Please ensure MongoDB is running on mongodb://127.0.0.1:27017

<h3>API Keys</h3>
There is one API Key for OpenAI. We have sent this key via the Canvas submission.

<h3>Running the Application</h3>
1. Clone the repository.
1. Install dependencies in the root directory of the project: npm install
1. Create a .env folder in the root directory of the project
1. Set the OpenAI API Key in .env as OPENAI_API_KEY="key" (replace with actual key)
1. Start the server: node server
1. Open the client application in your browser (http://localhost:3000/)