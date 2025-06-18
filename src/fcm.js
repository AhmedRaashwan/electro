const admin = require('firebase-admin');

async function sendFCMMessage(token, title, body, url) {
  try {
    const message = {
      notification: { title, body },
      webpush: { fcmOptions: { link: url || 'https://example.com' } },
      token,
    };
    const response = await admin.messaging().send(message);
    console.log('FCM Response:', response);
    return true;
  } catch (error) {
    console.error('Error sending FCM message:', error);
    return false;
  }
}

module.exports = { sendFCMMessage };
