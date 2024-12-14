const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/chat', (req, res) => {
    const userMessage = req.body.message;
    const feeReply = `Fee says: ${userMessage}`; // Replace with AI backend logic
    res.json({ reply: feeReply });
});

app.listen(5000, () => console.log('Server running on port 5000'));
