const express = require('express');
const path = require('path');
const { storeToken } = require('./tokens');
const { sendPushNotification } = require('./notifications');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse form data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (e.g., index.html)
app.use(express.static(path.join(__dirname, 'public')));

// GET: Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST: Handle token storage
app.post('/storeToken', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).send('Error: Token is empty');
    }
    const result = await storeToken(token);
    res.send(result);
  } catch (error) {
    console.error('Error in storeToken:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// POST: Send push notifications (optional endpoint for testing)
app.post('/sendNotification', async (req, res) => {
  try {
    const { title = 'Test Notification', body = 'This is a test message', url = null } = req.body;
    const result = await sendPushNotification(title, body, url);
    res.send(result);
  } catch (error) {
    console.error('Error in sendNotification:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
