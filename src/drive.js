const { google } = require('googleapis');
require('dotenv').config();

const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;

async function uploadImage(fileData) {
  try {
    if (!fileData.data || !fileData.mimeType || !fileData.name) {
      throw new Error('بيانات الملف غير صالحة: البيانات، نوع الملف، أو الاسم مفقود');
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const buffer = Buffer.from(fileData.data, 'base64');
    const fileMetadata = {
      name: fileData.name,
      parents: [DRIVE_FOLDER_ID],
    };
    const media = {
      mimeType: fileData.mimeType,
      body: buffer,
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink',
    });

    await drive.permissions.create({
      fileId: file.data.id,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return { success: true, url: file.data.webViewLink };
  } catch (error) {
    return { success: false, error: `خطأ في الرفع: ${error.message}` };
  }
}

module.exports = { uploadImage };
