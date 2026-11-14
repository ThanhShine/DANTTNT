const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/ai/chat', {
      message: 'Tai nghe chống ồn tốt nhất',
      session_id: 'test-session-123'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error Status:', err.response?.status);
    console.error('Error Data:', err.response?.data);
  }
}

test();
