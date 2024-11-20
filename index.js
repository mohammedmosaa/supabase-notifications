const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// إعداد Supabase
const supabase = createClient(
  'https://lgehaofjybaonyejerki.supabase.co', // رابط Supabase
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZWhhb2ZqeWJhb255ZWplcmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1MTY5NjIsImV4cCI6MjA0NzA5Mjk2Mn0.mBTXPJ-ps4WH22ELJwxqPbmXNde-smk1DCLZVCWluuo' // مفتاح API الخاص بـ Supabase
);

// معرف تطبيق OneSignal ومفتاح API
const ONESIGNAL_APP_ID = '7beb1513-38d1-42f0-9eaf-4c45e423b1e7';
const ONESIGNAL_API_KEY = 'pm5j55gx7ee24wo42xgo44m4y';

// دالة لإرسال إشعار عبر OneSignal
const sendPushNotification = async (title, body, playerId) => {
  const data = {
    app_id: ONESIGNAL_APP_ID,
    headings: { "en": title },
    contents: { "en": body },
    include_player_ids: [playerId], // إرسال الإشعار إلى جهاز واحد
  };

  try {
    const response = await axios.post('https://onesignal.com/api/v1/notifications', data, {
      headers: {
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`
      }
    });
    console.log('Notification sent:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

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
      async (payload) => {
        const { sender_id, message } = payload.new;
        console.log(`New message from ${sender_id}: ${message}`);

        // احصل على Player ID من قاعدة البيانات
        const userResponse = await supabase
          .from('users')
          .select('fcm_token')
          .eq('id', sender_id)  // استخدم id المستخدم للعثور على Player ID
          .single();

        if (userResponse.data) {
          const playerId = userResponse.data.fcm_token; // أو استخدم player_id بناءً على هيكل قاعدة البيانات الخاصة بك
          await sendPushNotification('New Message', message, playerId); // إرسال الإشعار
        }
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
