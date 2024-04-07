require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function getAiResponse(topic) {
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: topic,
      max_tokens: 1024,
      n: 1,
      stop: null,
      temperature: 0.7
    });
    console.log(completion.data.choices[0].text);
  } catch (error) {
    console.error('Error obtaining AI response:', error);
  }
}

getAiResponse("Tell me a joke about AI.");
