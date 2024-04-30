const { config } = require('dotenv');
const OpenAI = require('openai');
const fs = require('fs');

config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function generateChatResponse(messages) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating chat response:', error);
        throw error;
    }
}

async function transcribeAudio(audioPath) {
    try {
        const response = await openai.audio.transcriptions.create({
            model: "whisper-1",
            file: fs.createReadStream(audioPath),
        });
        return response.text;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        throw error;
    }
}

module.exports = { generateChatResponse, transcribeAudio };