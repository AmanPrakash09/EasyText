require('dotenv').config();
const language = require('@google-cloud/language');

async function main() {
  const client = new language.LanguageServiceClient({
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  });

  const text = 'I am feeling great today, the weather is so nice';

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  try {
    const [result] = await client.analyzeSentiment({ document });
    const sentiment = result.documentSentiment;

    console.log(`Sentiment score: ${sentiment.score}`);
    console.log(`Sentiment magnitude: ${sentiment.magnitude}`);
  } catch (err) {
    console.error('Error analyzing sentiment:', err);
  }
}

main();
