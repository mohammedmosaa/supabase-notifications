const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(bodyParser.json());

// إعداد Supabase
const supabase = createClient(
  'https://lgehaofjybaonyejerki.supabase.co', // رابط Supabase
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZWhhb2ZqeWJhb255ZWplcmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1MTY5NjIsImV4cCI6MjA0NzA5Mjk2Mn0.mBTXPJ-ps4WH22ELJwxqPbmXNde-smk1DCLZVCWluuo'                     // مفتاح API الخاص بـ Supabase
);

// مسار لإرسال الإشعارات
app.post('/send-notification', async (req, res) => {
  const { title, body } = req.body;

  // سجل العنوان والمحتوى
  console.log(`Title: ${title}, Body: ${body}`);

  // أرسل استجابة
  res.status(200).send({ message: 'Notification sent!' });
});

// مراقبة إدخالات جديدة في جدول الرسائل
const watchMessages = async () => {
  supabase
    .channel('messages-channel') // اسم القناة (يمكنك اختيار أي اسم)
    .on(
      'postgres_changes',
      {
        event: 'INSERT', // نوع الحدث (إدخال جديد)
        schema: 'public', // اسم المخطط (افتراضيًا "public")
        table: 'messages' // اسم الجدول
      },
      (payload) => {
        const { sender_id, message } = payload.new;
        console.log(`New message from ${sender_id}: ${message}`);
      }
    )
    .subscribe();
};


watchMessages();

// بدء تشغيل الخادم
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
