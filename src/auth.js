const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const USER_SHEET_NAME = process.env.USER_SHEET_NAME;

async function getUserData(email, password) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_SHEET_NAME}!A:Z`,
    });
    const data = response.data.values || [];
    const headers = data[0].map(h => String(h).trim());
    const emailIndex = headers.indexOf('Email');
    const nameIndex = headers.indexOf('DisplayName');
    const activeIndex = headers.indexOf('Active');
    const passwordIndex = headers.indexOf('Password');
    const roleIndex = headers.indexOf('Role');

    if (emailIndex === -1 || nameIndex === -1 || passwordIndex === -1 || roleIndex === -1) {
      throw new Error('الأعمدة المطلوبة مفقودة في ورقة المستخدمين');
    }

    for (const row of data.slice(1)) {
      const userEmail = row[emailIndex] ? String(row[emailIndex]).trim().toLowerCase() : '';
      const displayName = row[nameIndex] ? String(row[nameIndex]).trim() : '';
      const userPassword = row[passwordIndex] ? String(row[passwordIndex]).trim() : '';
      const role = row[roleIndex] ? String(row[roleIndex]).trim() : '';
      const activeStatus = activeIndex !== -1 ? String(row[activeIndex]).trim().toLowerCase() === 'true' : true;

      if (userEmail === email.toLowerCase() && userPassword === password && activeStatus && role === 'مدير نظام') {
        return { success: true, displayName };
      }
    }
    return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة، الحساب غير نشط، أو لست مدير نظام' };
  } catch (error) {
    return { success: false, message: `خطأ: ${error.message}` };
  }
}

async function checkDisplayStatus(displayName) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_SHEET_NAME}!A:Z`,
    });
    const data = response.data.values || [];
    const headers = data[0].map(h => String(h).trim());
    const nameIndex = headers.indexOf('DisplayName');
    const activeIndex = headers.indexOf('Active');
    const roleIndex = headers.indexOf('Role');

    if (nameIndex === -1 || roleIndex === -1) {
      throw new Error('الأعمدة المطلوبة مفقودة في ورقة المستخدمين');
    }

    for (const row of data.slice(1)) {
      const userDisplayName = row[nameIndex] ? String(row[nameIndex]).trim() : '';
      const role = row[roleIndex] ? String(row[roleIndex]).trim() : '';
      const activeStatus = activeIndex !== -1 ? String(row[activeIndex]).trim().toLowerCase() === 'true' : true;

      if (userDisplayName === displayName.trim() && activeStatus && role === 'مدير نظام') {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error in checkDisplayStatus:', error);
    return false;
  }
}

module.exports = { getUserData, checkDisplayStatus };
