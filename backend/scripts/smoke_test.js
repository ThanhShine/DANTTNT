// End-to-end smoke test of backend endpoints against the real DB.
// Any HTTP 500 = likely SQL/schema mismatch. Cleans up the test user afterwards.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const BASE = 'http://localhost:5000/api';
const email = `smoke_${Date.now()}@test.local`;
const password = 'Smoke@12345';
let token = '';
const results = [];

async function call(method, path, body, auth = true) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-json */ }
  results.push({ method, path, status: res.status, msg: res.status >= 400 ? (json?.message || '') + (json?.error ? ' | ' + JSON.stringify(json.error).slice(0, 200) : '') : '' });
  return json;
}

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  let userId;
  try {
    // ── Public ──
    const cats = await call('GET', '/categories', null, false);
    await call('GET', '/categories?tree=1', null, false);
    const catId = cats?.data?.[0]?.id;
    if (catId) await call('GET', `/categories/${catId}`, null, false);
    const prods = await call('GET', '/products?limit=5', null, false);
    await call('GET', '/products?sort=price_asc&min_price=1000&max_price=99999999', null, false);
    await call('GET', '/products/search?q=iphone', null, false);
    const prodList = prods?.data?.products || prods?.data || [];
    const productId = prodList[0]?.id;
    if (productId) {
      await call('GET', `/products/${productId}`, null, false);
      await call('GET', `/reviews/product/${productId}`, null, false);
    }

    // ── Auth ──
    await call('POST', '/auth/register', { email, password, full_name: 'Smoke Test', phone: '0900000000' }, false);
    const login = await call('POST', '/auth/login', { email, password }, false);
    token = login?.data?.accessToken || login?.data?.access_token || login?.data?.token || '';
    const refresh = login?.data?.refreshToken || login?.data?.refresh_token;
    if (!token) throw new Error('Login failed: ' + JSON.stringify(login));
    const [[u]] = await db.query('SELECT ma_id FROM nguoi_dung WHERE dia_chi_email = ?', [email]);
    userId = u.ma_id;
    await call('GET', '/auth/profile');
    if (refresh) await call('POST', '/auth/refresh', { refreshToken: refresh, refresh_token: refresh }, false);

    // ── Behaviors ──
    await call('POST', '/behaviors', { action_type: 'view', product_id: productId, session_id: 'smoke', duration: 5, source: 'smoke' });
    await call('POST', '/behaviors/batch', { behaviors: [{ action_type: 'click', product_id: productId }, { action_type: 'search', search_keyword: 'laptop' }] });
    await call('GET', `/behaviors/user/${userId}`);

    // ── Cart ──
    await call('GET', '/cart');
    await call('POST', '/cart/items', { product_id: productId, quantity: 1 });
    const cart = await call('GET', '/cart');
    const itemId = cart?.data?.items?.[0]?.id;
    if (itemId) await call('PUT', `/cart/items/${itemId}`, { quantity: 2 });
    await call('GET', '/cart/history');

    // ── Address + Order ──
    const addr = await call('POST', '/users/addresses', {
      recipient_name: 'Smoke', recipient_phone: '0900000000', province: 'HCM', district: 'Q1', ward: 'P1', address_detail: '1 Test', street_address: '1 Test', is_default: true,
    });
    const addressId = addr?.data?.id;
    const order = await call('POST', '/orders', {
      address_id: addressId, shipping_address_id: addressId, payment_method: 'COD', customer_note: 'smoke',
      shipping_address: { recipient_name: 'Smoke', phone: '0900000000', province: 'HCM', district: 'Q1', ward: 'P1', address_detail: '1 Test' },
    });
    await call('GET', '/orders');
    const orderId = order?.data?.id || order?.data?.order?.id;
    if (orderId) {
      await call('GET', `/orders/${orderId}`);
      await call('GET', `/orders/${orderId}/history`);
      await call('PUT', `/orders/${orderId}/cancel`, { reason: 'smoke test' });
    }
    await call('DELETE', '/cart');

    // ── Reviews / Account ──
    await call('GET', '/reviews/my');
    if (productId) await call('POST', '/reviews', { product_id: productId, rating: 5, title: 'smoke', comment: 'smoke test review' });
    await call('GET', '/account/login-history');
    await call('GET', '/account/activity');

    // ── AI chat (DB parts) ──
    const chat = await call('POST', '/ai/chat', { message: 'Tư vấn laptop gaming dưới 30 triệu' });
    const sid = chat?.data?.session_id;
    await call('GET', '/ai/chat/sessions');
    if (sid) {
      await call('GET', `/ai/chat/history/${sid}`);
      await call('DELETE', `/ai/chat/sessions/${sid}`);
    }

    // ── Admin (temporarily promote) ──
    await db.query("UPDATE nguoi_dung SET vai_tro = 'admin' WHERE ma_id = ?", [userId]);
    const relog = await call('POST', '/auth/login', { email, password }, false);
    token = relog?.data?.accessToken || relog?.data?.access_token || relog?.data?.token || token;
    for (const p of ['/admin/dashboard', '/admin/reports/revenue', '/admin/orders', '/admin/reviews',
      '/admin/stats/top-products', '/admin/stats/users', '/admin/inventory', '/admin/users',
      `/admin/users/${userId}`, '/users', `/users/${userId}`, '/orders/admin/all',
      '/behaviors', '/behaviors/stats', `/account/admin/users/${userId}/login-history`,
      `/account/admin/users/${userId}/activity`]) await call('GET', p);
    if (productId) await call('GET', `/behaviors/product/${productId}`);
    if (orderId) await call('PUT', `/admin/orders/${orderId}/status`, { status: 'cancelled', note: 'smoke' });
    await call('PUT', `/users/${userId}`, { full_name: 'Smoke Updated' });
    await call('POST', '/auth/logout');
  } catch (e) {
    console.error('FATAL', e.message);
  } finally {
    // ── Cleanup ──
    if (userId) {
      const del = async (sql) => { try { await db.query(sql, [userId]); } catch (e) { console.log('cleanup:', e.message); } };
      const [orders] = await db.query('SELECT ma_id FROM don_hang WHERE ma_nguoi_dung = ?', [userId]);
      for (const o of orders) {
        // restore stock that the test order reserved
        const [items] = await db.query('SELECT ma_san_pham, ma_bien_the, so_luong FROM chi_tiet_don_hang WHERE ma_don_hang = ?', [o.ma_id]);
        const [[st]] = await db.query('SELECT trang_thai FROM don_hang WHERE ma_id = ?', [o.ma_id]);
        if (st.trang_thai !== 'cancelled') for (const it of items) {
          await db.query('UPDATE san_pham SET so_luong_ton = so_luong_ton + ?, tong_da_ban = GREATEST(tong_da_ban - ?, 0) WHERE ma_id = ?', [it.so_luong, it.so_luong, it.ma_san_pham]);
        }
        await db.query('DELETE FROM lich_su_trang_thai_don_hang WHERE ma_don_hang = ?', [o.ma_id]);
        await db.query('DELETE FROM chi_tiet_don_hang WHERE ma_don_hang = ?', [o.ma_id]);
        await db.query('DELETE FROM giao_dich_thanh_toan WHERE ma_don_hang = ?', [o.ma_id]);
      }
      await del('DELETE FROM danh_gia WHERE ma_nguoi_dung = ?');
      await del('DELETE FROM don_hang WHERE ma_nguoi_dung = ?');
      await del('DELETE t FROM tin_nhan_tro_chuyen t JOIN phien_tro_chuyen p ON t.ma_phien = p.ma_id WHERE p.ma_nguoi_dung = ?');
      for (const t of ['phien_tro_chuyen', 'lich_su_gio_hang', 'hanh_vi_nguoi_dung', 'nhat_ky_hoat_dong_nguoi_dung',
        'lich_su_dang_nhap', 'dia_chi_nguoi_dung', 'yeu_thich']) await del(`DELETE FROM ${t} WHERE ma_nguoi_dung = ?`);
      await del('DELETE c FROM chi_tiet_gio_hang c JOIN gio_hang g ON c.ma_gio_hang = g.ma_id WHERE g.ma_nguoi_dung = ?');
      await del('DELETE FROM gio_hang WHERE ma_nguoi_dung = ?');
      await del('DELETE FROM nguoi_dung WHERE ma_id = ?');
    }
    await db.end();
    console.log('\nMETHOD PATH                                         STATUS  MESSAGE');
    for (const r of results) console.log(`${r.method.padEnd(6)} ${r.path.padEnd(45)} ${String(r.status).padEnd(7)} ${r.msg}`);
    const fails = results.filter(r => r.status >= 500);
    console.log(`\nTotal: ${results.length}, 5xx: ${fails.length}, 4xx: ${results.filter(r => r.status >= 400 && r.status < 500).length}`);
  }
})();
