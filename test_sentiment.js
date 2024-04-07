require('dotenv').config();
const language = require('@google-cloud/language');

async function main() {
  const client = new language.LanguageServiceClient({
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  });

  const text = 'I am feeling good today, the weather is so nice and I have a lot of homework';

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  try {
    const [result] = await client.analyzeEntitySentiment({ document });
    const entities = result.entities;

    console.log('Entities and sentiment:');
    entities.forEach(entity => {
      console.log(`  Name: ${entity.name}`);
      console.log(`  Type: ${entity.type}`);
      console.log(`  Score: ${entity.sentiment.score}`);
      console.log(`  Magnitude: ${entity.sentiment.magnitude}`);
    });
  } catch (err) {
    console.error('Error analyzing entity sentiment:', err);
  }
}

main();
