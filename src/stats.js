const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME;

async function getStats(dateFilter, dateRange) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`,
    });
    const data = response.data.values || [];
    if (data.length <= 1) {
      return { total: 0, new: 0, done: 0, pending: 0, cancelled: 0, ongoing: 0 };
    }

    const headers = data[0].map(h => String(h).trim());
    const statusIndex = headers.indexOf('Status');
    const dateIndex = headers.indexOf('Date time');

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let filteredRecords = data.slice(1).filter(row => String(row[headers.indexOf('Id')]).trim());

    if (dateRange && dateRange.from && dateRange.to) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      filteredRecords = filteredRecords.filter(row => {
        const date = new Date(row[dateIndex]);
        return !isNaN(date.getTime()) && date >= fromDate && date <= toDate;
      });
    } else if (dateFilter && dateFilter !== 'all' && dateFilter !== 'custom') {
      filteredRecords = filteredRecords.filter(row => {
        const date = new Date(row[dateIndex]);
        if (isNaN(date.getTime())) return false;
        const rowDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        if (dateFilter === 'today') {
          return rowDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const dayOfWeek = now.getDay();
          const daysSinceMonday = (dayOfWeek + 1) % 7;
          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
          const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
          return rowDate >= weekStart && rowDate <= weekEnd;
        } else if (dateFilter === 'month') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return rowDate >= monthStart && rowDate <= monthEnd;
        }
        return true;
      });
    }

    const stats = { total: 0, new: 0, done: 0, pending: 0, cancelled: 0, ongoing: 0 };
    filteredRecords.forEach(row => {
      stats.total++;
      const status = String(row[statusIndex]).toLowerCase().trim();
      if (status === 'done') stats.done++;
      else if (status === 'pending') stats.pending++;
      else if (status === 'cancelled') stats.cancelled++;
      else if (status === 'ongoing') stats.ongoing++;
      else if (status === 'new') stats.new++;
    });

    return stats;
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = { getStats };
