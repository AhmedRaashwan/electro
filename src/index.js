const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { getUserData, checkDisplayStatus } = require('./auth');
const { getContent } = require('./records');
const { getStats } = require('./stats');
const { updateRecord } = require('./records');
const { uploadImage } = require('./drive');
const { storeToken } = require('./tokens');
const { sendPushNotification } = require('./notifications');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: ['http://localhost:3000', 'https://electro-12753.web.app'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1] || req.cookies.token;
  if (!token) return res.status(401).json({ success: false, message: 'لم يتم تسجيل الدخول' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'رمز غير صالح' });
  }
};

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' });
    }
    const result = await getUserData(email, password);
    if (result.success) {
      const token = jwt.sign({ displayName: result.displayName }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.json({ success: true, displayName: result.displayName });
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ: ${error.message}` });
  }
});

// Check authentication status
app.get('/api/check-auth', authenticateToken, async (req, res) => {
  try {
    const isAuthenticated = await checkDisplayStatus(req.user.displayName);
    res.json({ success: isAuthenticated, displayName: req.user.displayName });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ: ${error.message}` });
  }
});

// Get content (records, stats, pagination)
app.get('/api/content', authenticateToken, async (req, res) => {
  try {
    const { page = 1, statusFilter = 'all', dateFilter = 'all', fromDate, toDate, searchQuery = '' } = req.query;
    const dateRange = fromDate && toDate ? { from: fromDate, to: toDate } : null;
    const result = await getContent(parseInt(page), statusFilter, dateFilter, dateRange, searchQuery);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get popup details
app.get('/api/popup/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;
    const result = await getContent(parseInt(page), 'all', 'all', null, '', id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update record
app.post('/api/update-record', authenticateToken, async (req, res) => {
  try {
    const { id, status, feedback, feedbackImg } = req.body;
    const result = await updateRecord(id, status, feedback, feedbackImg);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload image
app.post('/api/upload-image', authenticateToken, async (req, res) => {
  try {
    const { data, mimeType, name } = req.body;
    const result = await uploadImage({ data, mimeType, name });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Store FCM token (from previous conversation)
app.post('/storeToken', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).send('Error: Token is empty');
    const result = await storeToken(token);
    res.send(result);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Send push notification (from previous conversation)
app.post('/sendNotification', async (req, res) => {
  try {
    const { title = 'Test Notification', body = 'This is a test message', url = null } = req.body;
    const result = await sendPushNotification(title, body, url);
    res.send(result);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
