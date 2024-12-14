require('dotenv').config();
const { OpenAI } = require('openai');

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is defined in your .env file
});

(async () => {
  try {
    // Make a simple request to test the OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Use 'gpt-3.5-turbo' if you prefer lower costs
      messages: [
        { role: 'system', content: 'You are Fee, a helpful persona from SESMag.' },
        { role: 'user', content: 'Hello Fee! What is SESMag?' },
      ],
      max_tokens: 50,
    });

    console.log('Response from OpenAI:', response.choices[0].message.content);
  } catch (error) {
    console.error('Error with OpenAI API:', error);
  }
})();
