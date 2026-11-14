const axios = require('axios');

async function testChatApi() {
  const BASE_URL = 'http://localhost:5000/api';

  console.log('--- 1. Testing POST /api/chat/sessions (guest) ---');
  const createRes = await axios.post(`${BASE_URL}/chat/sessions`, {
    title: 'Tư vấn laptop gaming'
  });
  console.log('Session Created:', createRes.data);
  const sessionUuid = createRes.data.data.session_uuid;

  console.log('\n--- 2. Testing POST /api/chat/sessions/:sessionId/messages ---');
  const msgRes = await axios.post(`${BASE_URL}/chat/sessions/${sessionUuid}/messages`, {
    message: 'Tôi cần laptop khoảng 20 triệu'
  });
  console.log('Message Response Status:', msgRes.status);
  console.log('AI Message:', msgRes.data.data.ai_message?.message?.slice(0, 100) + '...');
  console.log('Products suggested:', msgRes.data.data.ai_message?.products?.length);

  console.log('\n--- 3. Testing Context: Second Message ---');
  const msgRes2 = await axios.post(`${BASE_URL}/chat/sessions/${sessionUuid}/messages`, {
    message: 'Tôi muốn máy khác'
  });
  console.log('Second AI Message:', msgRes2.data.data.ai_message?.message?.slice(0, 100) + '...');

  console.log('\n--- 4. Testing GET /api/chat/sessions/:sessionId ---');
  const detailRes = await axios.get(`${BASE_URL}/chat/sessions/${sessionUuid}`);
  console.log('Session Detail:', detailRes.data.data.session.title, 'Total messages:', detailRes.data.data.messages.length);

  console.log('\n✅ All API steps passed successfully!');
}

testChatApi().catch(err => {
  console.error('Test failed:', err.response?.data || err.message);
  process.exit(1);
});
