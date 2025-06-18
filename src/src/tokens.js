const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const TOKENS_SHEET_NAME = process.env.TOKENS_SHEET_NAME;

async function storeToken(token) {
  try {
    if (!token) {
      console.error('Token is empty');
      return 'Error: Token is empty';
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = spreadsheet.data.sheets.find(
      s => s.properties.title === TOKENS_SHEET_NAME
    );

    if (!sheet) {
      console.error(`Sheet "${TOKENS_SHEET_NAME}" not found`);
      return `Error: Sheet "${TOKENS_SHEET_NAME}" not found`;
    }

    // Get existing tokens
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TOKENS_SHEET_NAME}!A:A`,
    });

    let values = response.data.values || [];
    if (!values.length) {
      // First token, add headers
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TOKENS_SHEET_NAME}!A:B`,
        valueInputOption: 'RAW',
        resource: { values: [['Token', 'Date Added']] },
      });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TOKENS_SHEET_NAME}!A:B`,
        valueInputOption: 'RAW',
        resource: { values: [[token, new Date().toISOString()]] },
      });
      return 'Token stored successfully (first token)';
    }

    const tokens = values.flat();
    if (tokens.includes(token)) {
      return 'Token already exists';
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TOKENS_SHEET_NAME}!A:B`,
      valueInputOption: 'RAW',
      resource: { values: [[token, new Date().toISOString()]] },
    });

    return 'Token stored successfully';
  } catch (error) {
    console.error('Error in storeToken:', error);
    return `Error storing token: ${error.message}`;
  }
}

module.exports = { storeToken };
