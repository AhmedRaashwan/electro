const admin = require('firebase-admin');
const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const TOKENS_SHEET_NAME = process.env.TOKENS_SHEET_NAME;

async function sendPushNotification(title = 'Test Notification', body = 'This is a test message', url = null) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      });
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TOKENS_SHEET_NAME}!A:A`,
    });

    const values = response.data.values || [];
    if (values.length <= 1) {
      return 'No tokens found to send notifications to';
    }

    const tokens = values.slice(1).flat().filter(token => token);
    if (!tokens.length) {
      return 'No valid tokens found';
    }

    let successCount = 0;
    let errorCount = 0;

    const message = {
      notification: { title, body },
      webpush: { fcmOptions: { link: url || 'https://example.com' } },
    };

    for (const token of tokens) {
      try {
        await admin.messaging().send({ ...message, token });
        successCount++;
      } catch (error) {
        console.error('Error sending to token:', token, error);
        errorCount++;
      }
    }

    return `Notifications sent: ${successCount} successful, ${errorCount} failed`;
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return `Error sending notifications: ${error.message}`;
  }
}

module.exports = { sendPushNotification };
