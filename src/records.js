const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME;

function escapeJsString(str) {
  if (str == null) return '';
  return String(str)
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function translateStatus(statusEn) {
  const statusMap = {
    'new': 'جديد',
    'done': 'منتهي',
    'pending': 'معلق',
    'cancelled': 'ملغى',
    'ongoing': 'جاري'
  };
  return statusMap[statusEn.toLowerCase().trim()] || 'غير معروف';
}

async function fetchRecords(page = 1, statusFilter = 'all', dateFilter = 'all', dateRange = null, searchQuery = '', specificId = null) {
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
    if (data.length <= 1) return { records: [], totalPages: 1 };

    const headers = data[0].map(h => String(h).trim());
    const requiredHeaders = ['Id', 'Date time', 'User', 'Address', 'Note', 'Images link', 'Coordinates', 'Status', 'Feedback', 'FeedbackImg', 'datetimemodmgr', 'PACI'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) throw new Error('الأعمدة الناقصة: ' + missingHeaders.join(', '));

    let records = data.slice(1).filter(row => String(row[headers.indexOf('Id')]).trim());

    if (specificId) {
      records = records.filter(row => String(row[headers.indexOf('Id')]).trim() === String(specificId));
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase().trim();
      records = records.filter(row => headers.some((_, idx) => String(row[idx]).toLowerCase().trim().includes(lowerQuery)));
    }

    if (statusFilter !== 'all') {
      records = records.filter(row => String(row[headers.indexOf('Status')]).toLowerCase().trim() === statusFilter.toLowerCase());
    }

    if (dateRange && dateRange.from && dateRange.to) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      records = records.filter(row => {
        const date = new Date(row[headers.indexOf('Date time')]);
        return !isNaN(date.getTime()) && date >= fromDate && date <= toDate;
      });
    } else if (dateFilter !== 'all' && dateFilter !== 'custom') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      records = records.filter(row => {
        const date = new Date(row[headers.indexOf('Date time')]);
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

    records.sort((a, b) => {
      const dateA = new Date(a[headers.indexOf('Date time')]);
      const dateB = new Date(b[headers.indexOf('Date time')]);
      return isNaN(dateB.getTime()) - isNaN(dateA.getTime()) || dateB - dateA;
    });

    const pageSize = 15;
    const validPage = Math.max(1, isNaN(page) ? 1 : page);
    const start = (validPage - 1) * pageSize;
    const paginatedRecords = specificId ? records : records.slice(start, start + pageSize);

    const result = paginatedRecords.map(row => ({
      id: String(row[headers.indexOf('Id')]).trim(),
      dateTime: String(row[headers.indexOf('Date time')]).trim(),
      user: String(row[headers.indexOf('User')] || '').trim(),
      address: String(row[headers.indexOf('Address')] || '').trim(),
      note: String(row[headers.indexOf('Note')] || '').trim(),
      images: String(row[headers.indexOf('Images link')] || '').split(',').map(link => link.trim()).filter(Boolean),
      coordinates: String(row[headers.indexOf('Coordinates')] || '').trim(),
      status: String(row[headers.indexOf('Status')] || '').trim(),
      feedback: String(row[headers.indexOf('Feedback')] || '').trim(),
      feedbackImg: String(row[headers.indexOf('FeedbackImg')] || '').trim(),
      dateTimeModMgr: String(row[headers.indexOf('datetimemodmgr')] || '').trim(),
      PACI: String(row[headers.indexOf('PACI')] || '').trim()
    }));

    return {
      records: result,
      totalPages: specificId ? 1 : Math.ceil(records.length / pageSize)
    };
  } catch (error) {
    return { records: [], totalPages: 0, error: error.message };
  }
}

async function getContent(page, statusFilter, dateFilter, dateRange, searchQuery, specificId = null) {
  try {
    const recordsData = await fetchRecords(page, statusFilter, dateFilter, dateRange, searchQuery, specificId);
    const stats = await require('./stats').getStats(dateFilter, dateRange);

    if (specificId) {
      const record = recordsData.records.find(r => String(r.id) === String(specificId));
      if (!record) {
        return { success: false, error: 'السجل غير موجود' };
      }

      const statusOptions = ['new', 'done', 'pending', 'cancelled', 'ongoing'].map(opt => {
        const selected = record.status === opt ? 'selected' : '';
        const label = translateStatus(opt);
        return `<option value="${opt}" ${selected}>${label}</option>`;
      }).join('');

      const imagesHtml = record.images.map(link => {
        const fileIdMatch = link.match(/\/file\/d\/([^/]+)|id=([^&]+)/);
        const fileId = fileIdMatch ? (fileIdMatch[1] || fileIdMatch[2]) : '';
        if (!fileId) return '';
        const src = link.includes('video') ?
          `https://drive.google.com/uc?export=download&id=${fileId}` :
          `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
        const tag = link.includes('video') ?
          `<video src="${src}" class="w-full h-auto rounded-lg" controls onerror="this.src=''"></video>` :
          `<img src="${src}" alt="Image" class="w-full h-auto rounded-lg" onerror="this.src=''">`;
        return `
          <div class="image-container bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 transition-colors min-w-[300px]">
            ${tag}
          </div>`;
      }).join('');

      let feedbackImgHtml = '';
      if (record.feedbackImg && record.feedbackImg.match(/\/file\/d\/([^/]+)|id=([^&]+)/)) {
        const fileIdMatch = record.feedbackImg.match(/\/file\/d\/([^/]+)|id=([^&]+)/);
        const fileId = fileIdMatch ? (fileIdMatch[1] || fileIdMatch[2]) : '';
        feedbackImgHtml = `
          <div class="mt-3 feedback-img-container">
            <img id="feedback-img-preview" src="https://drive.google.com/thumbnail?id=${fileId}&sz=w800" alt="Feedback Image" class="w-full h-auto rounded-lg" onerror="this.src='https://placeholder.pics/svg/300x50/DEDEDE/555555/%D9%84%D9%85%20%D9%8A%D8%AA%D9%85%20%D8%A7%D8%B1%D9%81%D8%A7%D9%82%20%D8%A7%D9%84%D8%AA%D9%82%D8%B1%D9%8A%D8%B1%20%D8%AD%D8%AA%D9%89%20%D8%A7%D9%84%D8%A2%D9%86'; this.classList.add('opacity-50');">
          </div>
        `;
      } else {
        feedbackImgHtml = `
          <div class="mt-3 feedback-img-container">
            <img id="feedback-img-preview" src="https://placeholder.pics/svg/300x50/DEDEDE/555555/%D9%84%D9%85%20%D9%8A%D8%AA%D9%85%20%D8%A7%D8%B1%D9%81%D8%A7%D9%82%20%D8%A7%D9%84%D8%AA%D9%82%D8%B1%D9%8A%D8%B1%20%D8%AD%D8%AA%D9%89%20%D8%A7%D9%84%D8%A2%D9%86" alt="Feedback Image" class="w-full h-auto rounded-lg opacity-50">
          </div>
        `;
      }

      const rawId = String(record.id);
      const escapedId = escapeJsString(rawId);
      const hasFeedbackImg = record.feedbackImg && record.feedbackImg.match(/\/file\/d\/([^/]+)|id=([^&]+)/) ? 'نعم' : 'لا';

      const popupHtml = `
<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f8fafc;
    color: #2d3748;
    margin: 0.75rem;
    font-size: 20px;
    line-height: 1.5;
  }
  .container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 900px;
    margin: auto;
    padding: 0.5rem;
  }
  section {
    border-radius: 6px;
    padding: 0.75rem;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .basic-info-section {
    border: 1px solid #d1e7ff;
    background: linear-gradient(135deg, #e6f0ff 0%, #f0f7ff 100%);
  }
  .section-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: #1e40af;
    margin-bottom: 0.5rem;
    text-align: right;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.4rem;
  }
  @media (min-width: 640px) {
    .info-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.25rem 0;
    font-size: 20px;
  }
  .basic-info-section .info-row label {
    font-weight: 500;
    color: #4b5563;
    white-space: nowrap;
    min-width: 80px;
    text-align: right;
  }
  .basic-info-section .info-row p {
    margin: 0;
    flex: 1;
    text-align: right;
    color: #1f2937;
  }
  .text-sm {
    font-size: 20px;
    color: #6b7280;
    text-align: center;
  }
  .link {
    color: #1d4ed8;
    text-decoration: underline;
    transition: color 0.2s;
  }
  .link:hover {
    color: #1e40af;
  }
  .form-group {
    margin-bottom: 0.5rem;
  }
  .form-group label {
    display: inline-block;
    margin-bottom: 0.2rem;
    font-weight: 500;
    color: #4b5563;
  }
  select, textarea {
    width: 100%;
    padding: 0.3rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-family: inherit;
    font-size: 20px;
    background-color: #fff;
  }
  textarea {
    resize: vertical;
  }
  .button-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  button {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
    font-size: 20px;
    transition: background-color 0.2s;
  }
  .btn-blue {
    background-color: #2563eb;
  }
  .btn-blue:hover {
    background-color: #1d4ed8;
  }
  .btn-gray {
    background-color: #6b7280;
  }
  .btn-gray:hover {
    background-color: #4b5563;
  }
  .btn-save {
    background-color: #1d4ed8;
    margin-top: 0.75rem;
  }
  input[type="file"] {
    display: none;
  }
</style>
<div class="container">
  <section class="basic-info-section">
    <h4 class="section-title">المعلومات الأساسية</h4>
    <div class="info-grid">
      <div class="info-row"><label>المعرف:</label><p>${rawId}</p></div>
      <div class="info-row"><label>التاريخ:</label><p>${new Date(record.dateTime).toLocaleString('ar-EG', { timeZone: 'Asia/Riyadh' })}</p></div>
      <div class="info-row"><label>المستخدم:</label><p>${record.user || 'غير محدد'}</p></div>
      <div class="info-row"><label>العنوان:</label><p>${record.address || 'غير محدد'}</p></div>
      <div class="info-row"><label>الملاحظات:</label><p>${record.note || '-'}</p></div>
      <div class="info-row"><label>رقم PACI:</label>
        <p>${record.PACI ? `<a href="https://gis.paci.gov.kw/Search/${encodeURIComponent(record.PACI)}" target="_blank" class="link">${record.PACI}</a>` : '-'}</p>
      </div>
      <div class="info-row"><label>الإحداثيات:</label>
        <p><a href="https://maps.google.com/?q=${encodeURIComponent(record.coordinates || '')}" target="_blank" class="link">${record.coordinates || '-'}</a></p>
      </div>
      <div class="info-row"><label>هل التقرير مرفق؟:</label><p>${hasFeedbackImg}</p></div>
    </div>
  </section>
  <section>
    <h4 class="section-title">الصور والفيديوهات</h4>
    ${imagesHtml || '<p class="text-sm">لا يوجد صور أو فيديوهات</p>'}
  </section>
  <section>
    <h4 class="section-title">ملاحظات المدير</h4>
    <div class="form-group">
      <label for="status">الحالة:</label>
      <select id="status">${statusOptions}</select>
    </div>
    <div class="form-group">
      <label for="feedback">التعليق:</label>
      <textarea id="feedback" rows="5" placeholder="أدخل تعليقك...">${record.feedback || ''}</textarea>
    </div>
    <div class="form-group" id="photo-controls">
      <label for="feedback-img">صورة التقرير الإداري:</label>
      <div class="button-row">
        <input id="feedback-img" type="file" accept="image/*">
        <button id="file-button" type="button" class="btn-blue">رفع صورة</button>
        <button id="camera-button" type="button" class="btn-blue">التقاط صورة</button>
        <button id="remove-img-button" type="button" class="btn-gray">حذف الصورة</button>
      </div>
      ${feedbackImgHtml}
    </div>
    <button onclick="saveChanges('${escapedId}')" class="btn-save">حفظ التغييرات</button>
  </section>
</div>
      `;
      return { success: true, popupHtml };
    }

    const statsHtml = `
<div style="text-align: center;">
  <h2 style="font-size: 1.5rem; font-weight: 600; color: #4a5568; margin-bottom: 0.75rem;">إحصائيات</h2>
  <table style="width: 100%; text-align: center; font-size: 1.125rem;">
    <thead>
      <tr style="background-color: #e3f2fd;">
        <th style="padding: 1rem;">الإجمالي</th>
        <th style="padding: 1rem;">جديد</th>
        <th style="padding: 1rem;">منتهي</th>
        <th style="padding: 1rem;">معلق</th>
        <th style="padding: 1rem;">ملغى</th>
        <th style="padding: 1rem;">جاري</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 1rem; font-weight: bold; color: #000000;">${stats.total || 0}</td>
        <td style="padding: 1rem; font-weight: bold; color: #dd6b20;">${stats.new || 0}</td>
        <td style="padding: 1rem; font-weight: bold; color: #2f855a;">${stats.done || 0}</td>
        <td style="padding: 1rem; font-weight: bold; color: #000000;">${stats.pending || 0}</td>
        <td style="padding: 1rem; font-weight: bold; color: #c53030;">${stats.cancelled || 0}</td>
        <td style="padding: 1rem; font-weight: bold; color: #2b6cb0;">${stats.ongoing || 0}</td>
      </tr>
    </tbody>
  </table>
</div>
    `;

    let recordsHtml = '';
    if (!recordsData.records || recordsData.records.length === 0) {
      recordsHtml = '<p class="text-center text-gray-500 text-lg">لا توجد سجلات لعرضها</p>';
    } else {
      recordsHtml = recordsData.records.map(record => {
        const statusClass = record.status === 'done' ? 'text-green-600' :
          record.status === 'new' ? 'text-yellow-600' :
            record.status === 'pending' ? 'text-yellow-600' :
              record.status === 'cancelled' ? 'text-red-600' : 'text-blue-600';
        const imagesHtml = record.images.slice(0, 3).map(link => {
          const fileIdMatch = link.match(/\/file\/d\/([^/]+)|id=([^&]+)/);
          const fileId = fileIdMatch ? (fileIdMatch[1] || fileIdMatch[2]) : '';
          if (!fileId) return '';
          const src = link.includes('video') ?
            `https://drive.google.com/uc?export=download&id=${fileId}` :
            `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
          const tag = link.includes('video') ?
            `<video src="${src}" class="w-48 h-48 object-cover rounded-lg shadow-sm" controls onerror="this.src='https://via.placeholder.com/200'"></video>` :
            `<img src="${src}" class="w-48 h-48 object-cover rounded-lg shadow-sm" onerror="this.src='https://via.placeholder.com/200'">`;
          return tag;
        }).filter(tag => tag).join('');

        const imgCount = record.images.filter(link => !link.includes('video')).length;
        const vidCount = record.images.filter(link => link.includes('video')).length;
        const filesCount = `${imgCount} صورة ${vidCount} فيديو`;
        const rawId = String(record.id);
        const escapedId = escapeJsString(rawId);

        const feedback = record.feedback && record.feedback.length > 100
          ? record.feedback.substring(0, 100) + '...'
          : record.feedback || 'لا يوجد تعليق';
        const note = record.note && record.note.length > 100
          ? record.note.substring(0, 100) + '...'
          : record.note || 'لا يوجد ملاحظات';

        const paciLink = record.PACI ?
          `<a href="https://gis.paci.gov.kw/Search/${encodeURIComponent(record.PACI)}" target="_blank" class="text-blue-600 hover:underline">${record.PACI}</a>` :
          'غير محدد';

        const hasFeedbackImg = record.feedbackImg && record.feedbackImg.match(/\/file\/d\/([^/]+)|id=([^&]+)/) ? 'نعم' : 'لا';
        let feedbackImgURL = '';
        if (record.feedbackImg && record.feedbackImg.match(/\/file\/d\/([^/]+)|id=([^&]+)/)) {
          const fileIdMatch = record.feedbackImg.match(/\/file\/d\/([^/]+)|id=([^&]+)/);
          const fileId = fileIdMatch ? (fileIdMatch[1] || fileIdMatch[2]) : '';
          feedbackImgURL = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1800`;
        }

        return `
<style>
  .record-card {
    background: linear-gradient(to bottom right, #ebf8ff, #90cdf4);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    width: 100%;
    max-width: 96rem;
    margin-left: auto;
    margin-right: auto;
    border: 1px solid #e5e7eb;
    transition: box-shadow 0.3s;
  }
  .record-card:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
  @media (min-width: 640px) {
    .record-card {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .images-column {
    min-width: 200px;
    order: -1;
  }
  .images-scroll {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
    scroll-snap-type: x mandatory;
  }
  .text-column {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .text-label {
    font-weight: 600;
    font-size: 1.2rem;
  }
  .text-value {
    font-size: 1.2rem;
    color: #77787A;
  }
  .status-text-value {
    font-size: 1.3rem;
  }
  .details-button {
    margin-top: 0.25rem;
    background-color: #3182ce;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 1.3rem;
    align-self: flex-end;
    transition: transform 0.2s, background-color 0.2s;
    border: none;
    cursor: pointer;
  }
  .details-button:hover {
    background-color: #2b6cb0;
    transform: scale(1.05);
  }
  .status {
    font-weight: 500;
  }
</style>
<div class="record-card">
  <div class="images-column" onclick="openPopup('${escapedId}')">
    <div class="images-scroll">
      ${imagesHtml || '<p style="color:#6b7280; font-size: 0.875rem; flex-shrink:0;">لا توجد صور</p>'}
    </div>
  </div>
  <div class="text-column">
    <p class="text-label">رقم التسلسل: <span class="text-value">${rawId}</span></p>
    <p class="text-label">التاريخ: <span class="text-value">${new Date(record.dateTime).toLocaleString('ar-EG', { timeZone: 'Asia/Riyadh' })}</span></p>
    <p class="text-label">المستخدم: <span class="text-value">${record.user || 'غير محدد'}</span></p>
    <p class="text-label">العنوان: <span class="text-value">${record.address || 'غير محدد'}</span></p>
    <p class="text-label">الملاحظات: <span class="text-value">${note}</span></p>
  </div>
  <div class="text-column">
    <p class="text-label">الملفات: <span class="text-value">${filesCount}</span></p>
    <p class="text-label">الموقع على خرائط جوجل:
      <span class="text-value">
        <a href="https://maps.google.com/?q=${encodeURIComponent(record.coordinates || '')}" target="_blank" style="color: #2563eb; text-decoration: underline;">عرض</a>
      </span>
    </p>
    <p class="text-label">PACI الرقم الآلي: <span class="text-value">${paciLink}</span></p>
    <p class="text-label">تعليق المشرف: <span class="text-value">${feedback}</span></p>
    <p class="text-label">هل التقرير مرفق؟: <span class="text-value">${hasFeedbackImg === 'نعم' ? `<a href="${feedbackImgURL}" target="_blank" style="color: #2563eb; text-decoration: underline;">${hasFeedbackImg} (عرض)</a>` : hasFeedbackImg}</span></p>
    <p class="text-label">الحالة: <span class="status-text-value status ${statusClass}">${translateStatus(record.status)}</span></p>
    <button onclick="openPopup('${escapedId}')" class="details-button">عرض التفاصيل</button>
  </div>
</div>
        `;
      }).join('');
    }

    const totalPages = recordsData.totalPages || 1;
    let paginationHtml = '';
    if (totalPages > 1) {
      const buttons = [
        { label: 'الأول', page: 1, disabled: page === 1 },
        { label: 'السابق', page: page - 1, disabled: page === 1 },
        { label: `الصفحة ${page} من ${totalPages}`, page: null, disabled: true },
        { label: 'التالي', page: page + 1, disabled: page === totalPages },
        { label: 'الأخير', page: totalPages, disabled: page === totalPages },
      ];
      paginationHtml = buttons.map(btn => {
        if (btn.page === null) {
          return `<span class="px-4 py-2 text-gray-700 text-lg">${btn.label}</span>`;
        }
        const disabledClass = btn.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700';
        const onclickAttr = btn.disabled ? '' : `onclick="goToPage(${btn.page})"`;
        return `<button class="bg-blue-600 text-white px-4 py-2 rounded-lg ${disabledClass} text-lg" ${btn.disabled ? 'disabled' : ''} ${onclickAttr}>${btn.label}</button>`;
      }).join('');
    }

    return {
      success: true,
      statsHtml,
      recordsHtml,
      paginationHtml,
      currentPage: page
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateRecord(id, status, feedback, feedbackImg) {
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
    const headers = data[0].map(h => String(h).trim());
    const rowIndex = data.findIndex(row => String(row[headers.indexOf('Id')]).trim() === String(id).trim());
    if (rowIndex === -1) {
      throw new Error('السجل غير موجود');
    }

    const updates = [
      { range: `${SHEET_NAME}!${String.fromCharCode(65 + headers.indexOf('Status'))}${rowIndex + 1}`, value: status },
      { range: `${SHEET_NAME}!${String.fromCharCode(65 + headers.indexOf('Feedback'))}${rowIndex + 1}`, value: feedback },
      { range: `${SHEET_NAME}!${String.fromCharCode(65 + headers.indexOf('FeedbackImg'))}${rowIndex + 1}`, value: feedbackImg || '' },
      { range: `${SHEET_NAME}!${String.fromCharCode(65 + headers.indexOf('datetimemodmgr'))}${rowIndex + 1}`, value: new Date().toISOString() },
    ];

    for (const update of updates) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: update.range,
        valueInputOption: 'RAW',
        resource: { values: [[update.value]] },
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { fetchRecords, getContent, updateRecord, translateStatus };
