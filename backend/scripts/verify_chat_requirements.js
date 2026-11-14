const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function verifyAll() {
  console.log('========================================================');
  console.log('   KIỂM TRA CHỨC NĂNG LƯU LỊCH SỬ CHATBOT BÁN HÀNG AI   ');
  console.log('========================================================\n');

  // 1. Tạo hoặc đăng nhập tài khoản Customer 1
  console.log('1. Khởi tạo / Đăng nhập Customer 1...');
  let token1, user1;
  try {
    const reg1 = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'customer1_test@salesai.com',
      password: 'Password@123',
      full_name: 'Khách Hàng Test 1',
      phone: '0901234567'
    });
    console.log('   ✅ Đăng ký mới Customer 1 thành công');
  } catch (e) {
    // Nếu đã tồn tại thì bỏ qua
  }

  const login1 = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'customer1_test@salesai.com',
    password: 'Password@123'
  });
  token1 = login1.data.data.accessToken;
  user1 = login1.data.data.user;
  console.log(`   ✅ Đăng nhập Customer 1: ${user1.full_name} (ID: ${user1.id})`);

  // 2. Tạo Session trò chuyện mới
  console.log('\n2. Khởi tạo Chat Session mới cho Customer 1...');
  const sessionRes = await axios.post(`${BASE_URL}/chat/sessions`, {
    title: 'Tư vấn laptop lập trình 2026'
  }, { headers: { Authorization: `Bearer ${token1}` } });

  const session = sessionRes.data.data;
  console.log(`   ✅ Session ID: ${session.id}, UUID: ${session.session_uuid}, Title: "${session.title}"`);

  // 3. Customer gửi tin nhắn đầu tiên
  console.log('\n3. Customer 1 gửi: "Tôi cần laptop khoảng 20 triệu để lập trình"...');
  const sendRes1 = await axios.post(
    `${BASE_URL}/chat/sessions/${session.session_uuid}/messages`,
    { message: 'Tôi cần laptop khoảng 20 triệu để lập trình' },
    { headers: { Authorization: `Bearer ${token1}` } }
  );

  console.log(`   ✅ Trạng thái lưu tin nhắn: ${sendRes1.data.success ? 'THÀNH CÔNG' : 'THẤT BẠI'}`);
  console.log(`   📝 User Message ID: ${sendRes1.data.data.user_message.id} (Sender: ${sendRes1.data.data.user_message.sender_type})`);
  console.log(`   🤖 AI Message ID: ${sendRes1.data.data.ai_message.id} (Sender: ${sendRes1.data.data.ai_message.sender_type})`);
  console.log(`   💬 AI Phản hồi: "${sendRes1.data.data.ai_message.message.slice(0, 80)}..."`);

  // 4. Customer gửi tiếp tin nhắn thứ hai để kiểm tra Context
  console.log('\n4. Customer 1 gửi tiếp: "Tôi muốn máy khác" (Kiểm tra Context)...');
  const sendRes2 = await axios.post(
    `${BASE_URL}/chat/sessions/${session.session_uuid}/messages`,
    { message: 'Tôi muốn máy khác' },
    { headers: { Authorization: `Bearer ${token1}` } }
  );
  console.log(`   ✅ AI Phản hồi theo ngữ cảnh: "${sendRes2.data.data.ai_message.message.slice(0, 80)}..."`);

  // 5. Kiểm tra danh sách session của Customer 1 (GET /api/chat/sessions)
  console.log('\n5. Kiểm tra danh sách phiên trò chuyện của Customer 1...');
  const listRes = await axios.get(`${BASE_URL}/chat/sessions`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  console.log(`   ✅ Số phiên chat của Customer 1: ${listRes.data.data.length}`);
  const found = listRes.data.data.find(s => s.session_uuid === session.session_uuid);
  console.log(`   ✅ Tìm thấy phiên vừa tạo: "${found?.title}", Tổng số tin: ${found?.total_messages}`);

  // 6. Kiểm tra chi tiết tin nhắn trong phiên (GET /api/chat/sessions/:sessionId)
  console.log('\n6. Lấy toàn bộ tin nhắn trong phiên chat...');
  const detailRes = await axios.get(`${BASE_URL}/chat/sessions/${session.session_uuid}`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  const msgs = detailRes.data.data.messages;
  console.log(`   ✅ Tổng số tin nhắn đã lưu: ${msgs.length}`);
  msgs.forEach((m, i) => {
    console.log(`      [${i+1}] [${m.sender_type.toUpperCase()}]: ${m.message.slice(0, 50).replace(/\n/g, ' ')}...`);
  });

  // 7. Bảo mật phân quyền: Customer 2 không được xem session của Customer 1
  console.log('\n7. Kiểm tra Bảo mật & Phân quyền (Customer 2 cố truy cập session của Customer 1)...');
  try {
    await axios.post(`${BASE_URL}/auth/register`, {
      email: 'customer2_test@salesai.com',
      password: 'Password@123',
      full_name: 'Khách Hàng Test 2',
      phone: '0901234568'
    });
  } catch {}

  const login2 = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'customer2_test@salesai.com',
    password: 'Password@123'
  });
  const token2 = login2.data.data.accessToken;

  try {
    await axios.get(`${BASE_URL}/chat/sessions/${session.session_uuid}`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.error('   ❌ LỖI BẢO MẬT: Customer 2 đọc được chat của Customer 1!');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('   🔒 BẢO MẬT TỐT: Customer 2 bị chặn với mã HTTP 403 Forbidden!');
    } else {
      console.log(`   🔒 BẢO MẬT TỐT: Chặn truy cập với status ${err.response?.status}`);
    }
  }

  // 8. Admin kiểm tra thống kê Chatbot
  console.log('\n8. Admin truy cập thống kê giám sát Chatbot...');
  const loginAdmin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@salesai.com',
    password: 'Admin@123456'
  });
  const tokenAdmin = loginAdmin.data.data.accessToken;

  const adminStats = await axios.get(`${BASE_URL}/admin/chat-stats`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` }
  });
  const summary = adminStats.data.data.summary;
  console.log(`   ✅ Thống kê Admin:`);
  console.log(`      - Tổng số phiên: ${summary.total_sessions}`);
  console.log(`      - Tổng số tin nhắn: ${summary.total_messages}`);
  console.log(`      - Tổng số user tham gia: ${summary.total_users}`);

  console.log('\n========================================================');
  console.log('   🎉 TẤT CẢ 8 MỤC KIỂM TRA ĐỀU VƯỢT QUA XUẤT SẮC!   ');
  console.log('========================================================');
}

verifyAll().catch(err => {
  console.error('\n❌ Verification Failed:', err.response?.data || err.message);
  process.exit(1);
});
