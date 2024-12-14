const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');
const pdf = require('pdf-parse'); // For extracting text from PDFs
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg'); // PostgreSQL library for database connection
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.connect((err) => {
  if (err) {
    console.error('[ERROR] Failed to connect to the database:', err.stack);
  } else {
    console.log('[INFO] Connected to the database successfully!');
  }
});

// Middleware to enable CORS
app.use(
  cors({
    origin: 'http://localhost:3000', // Your frontend URL
    methods: 'GET,POST,PUT,DELETE', // HTTP methods allowed
    allowedHeaders: 'Content-Type,Authorization', // Headers allowed
  })
);

// Middleware to parse JSON bodies
app.use(express.json());

// Multer configuration for file uploads
const upload = multer({ dest: 'uploads/' }); // Store uploads in the 'uploads/' directory

// Root route
app.get('/', (req, res) => {
  console.log('[INFO] GET request to /');
  res.send('Hello from the backend!');
});

// File upload route with PDF processing
app.post('/upload', upload.single('file'), async (req, res) => {
  console.log('[INFO] POST request to /upload');

  if (!req.file) {
    console.error('[ERROR] No file uploaded.');
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    const filePath = path.resolve(req.file.path);
    const fileBuffer = fs.readFileSync(filePath);

    // Extract text from PDF
    const pdfData = await pdf(fileBuffer);
    const pdfText = pdfData.text;

    console.log('[INFO] Extracted PDF Text:', pdfText);

    // Save uploaded file to database
    const result = await pool.query(
      'INSERT INTO uploads (file_name, file_content) VALUES ($1, $2) RETURNING *',
      [req.file.originalname, pdfText]
    );
    console.log('[INFO] File saved to database:', result.rows[0]);

    // Send the extracted PDF content back to the frontend
    res.json({ message: 'File uploaded successfully!', content: pdfText });
  } catch (error) {
    console.error('[ERROR] Failed to process the PDF file:', error);
    res.status(500).json({ error: 'Failed to process the PDF file.' });
  }
});

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure the key is correctly loaded
});

// ChatGPT API usage with optional PDF content
app.post('/chat', async (req, res) => {
  const { message, pdfContent } = req.body; // Accept `message` and optional `pdfContent`

  if (!message) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    // Combine PDF content with user's message if provided
    const systemMessage =
      'You are Fee, a helpful persona from SESMag. Use the provided PDF content to assist with your responses.';
    const fullPrompt = pdfContent
      ? `${systemMessage}\n\nPDF Content: ${pdfContent}\n\nUser's Question: ${message}`
      : `${systemMessage}\n\nUser's Question: ${message}`;

    console.log('[DEBUG] Full Prompt Sent to OpenAI:', fullPrompt);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Use 'gpt-3.5-turbo' for lower cost
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: fullPrompt },
      ],
      max_tokens: 100, // Adjust token limit as needed
    });

    const reply = response.choices[0].message.content.trim();
    console.log('[INFO] OpenAI Reply:', reply);

    // Save conversation to database
    const result = await pool.query(
      'INSERT INTO conversations (user_message, fee_response) VALUES ($1, $2) RETURNING *',
      [message, reply]
    );
    console.log('[INFO] Conversation saved to database:', result.rows[0]);

    res.json({ reply });
  } catch (error) {
    console.error('Error with ChatGPT API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to process the request.' });
  }
});

// Fetch conversation history
app.get('/conversations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM conversations ORDER BY timestamp DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('[ERROR] Failed to fetch conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// Fetch uploaded files
app.get('/uploads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM uploads ORDER BY uploaded_at DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('[ERROR] Failed to fetch uploads:', error);
    res.status(500).json({ error: 'Failed to fetch uploads.' });
  }
});

// Handle form submissions and save data to the database
app.post('/submit-form', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO forms (name, email, message) VALUES ($1, $2, $3) RETURNING *',
      [name, email, message]
    );
    console.log('[INFO] Form submission saved:', result.rows[0]);
    res.status(201).json({ message: 'Form submitted successfully!', data: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Failed to save form submission:', error);
    res.status(500).json({ error: 'Failed to save form submission.' });
  }
});

// Fetch form submissions
app.get('/form-submissions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM forms ORDER BY submitted_at DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('[ERROR] Failed to fetch form submissions:', error);
    res.status(500).json({ error: 'Failed to fetch form submissions.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`[INFO] Server running on http://localhost:${PORT}`);
});
