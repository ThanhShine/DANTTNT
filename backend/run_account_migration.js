const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function addColumnIfNotExists(connection, dbName, table, column, definition) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, table, column]
  );
  if (rows[0].cnt === 0) {
    console.log(`  Adding column ${column} to ${table}...`);
    await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } else {
    // already exists
  }
}

async function runMigration() {
  const dbName = process.env.DB_NAME || 'sales_ai_system';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: dbName,
  });

  console.log('Connected to MySQL. Safely adding missing columns and tables...');

  try {
    // 1. users
    console.log('Step 1: Checking users table...');
    await addColumnIfNotExists(connection, dbName, 'users', 'phone', "VARCHAR(20) NULL COMMENT 'Số điện thoại' AFTER full_name");
    await addColumnIfNotExists(connection, dbName, 'users', 'is_active', "TINYINT(1) DEFAULT 1 COMMENT 'Trạng thái tài khoản' AFTER role");
    await addColumnIfNotExists(connection, dbName, 'users', 'last_login_at', "TIMESTAMP NULL COMMENT 'Lần đăng nhập gần nhất' AFTER is_active");
    await addColumnIfNotExists(connection, dbName, 'users', 'refresh_token', "TEXT NULL COMMENT 'JWT Refresh Token' AFTER last_login_at");
    await addColumnIfNotExists(connection, dbName, 'users', 'email_verified', "TINYINT(1) DEFAULT 0 COMMENT 'Email đã xác nhận' AFTER refresh_token");
    await addColumnIfNotExists(connection, dbName, 'users', 'avatar_url', "VARCHAR(500) NULL COMMENT 'URL ảnh đại diện' AFTER email_verified");

    // 2. orders
    console.log('Step 2: Checking orders table...');
    await addColumnIfNotExists(connection, dbName, 'orders', 'order_code', "VARCHAR(20) NULL UNIQUE COMMENT 'Mã đơn hàng' AFTER id");
    await addColumnIfNotExists(connection, dbName, 'orders', 'subtotal', "DECIMAL(12,2) DEFAULT 0 COMMENT 'Tạm tính' AFTER shipping_address");
    await addColumnIfNotExists(connection, dbName, 'orders', 'discount_amount', "DECIMAL(12,2) DEFAULT 0 COMMENT 'Giảm giá' AFTER subtotal");
    await addColumnIfNotExists(connection, dbName, 'orders', 'shipping_fee', "DECIMAL(10,2) DEFAULT 0 COMMENT 'Phí ship' AFTER discount_amount");
    await addColumnIfNotExists(connection, dbName, 'orders', 'coupon_id', "INT NULL COMMENT 'ID mã giảm giá' AFTER discount_amount");
    await addColumnIfNotExists(connection, dbName, 'orders', 'payment_method', "VARCHAR(50) DEFAULT 'COD' COMMENT 'Phương thức thanh toán' AFTER shipping_fee");
    await addColumnIfNotExists(connection, dbName, 'orders', 'payment_status', "VARCHAR(20) DEFAULT 'pending' COMMENT 'Trạng thái thanh toán' AFTER payment_method");
    await addColumnIfNotExists(connection, dbName, 'orders', 'shipped_at', "TIMESTAMP NULL AFTER payment_status");
    await addColumnIfNotExists(connection, dbName, 'orders', 'delivered_at', "TIMESTAMP NULL AFTER shipped_at");
    await addColumnIfNotExists(connection, dbName, 'orders', 'cancelled_at', "TIMESTAMP NULL AFTER delivered_at");
    await addColumnIfNotExists(connection, dbName, 'orders', 'cancel_reason', "TEXT NULL AFTER cancelled_at");
    await addColumnIfNotExists(connection, dbName, 'orders', 'customer_note', "TEXT NULL AFTER cancel_reason");
    await addColumnIfNotExists(connection, dbName, 'orders', 'admin_note', "TEXT NULL AFTER customer_note");

    // 3. order_items
    console.log('Step 3: Checking order_items table...');
    await addColumnIfNotExists(connection, dbName, 'order_items', 'variant_id', "INT NULL AFTER product_id");
    await addColumnIfNotExists(connection, dbName, 'order_items', 'product_name', "VARCHAR(200) NULL COMMENT 'Tên sản phẩm tại thời điểm đặt' AFTER variant_id");
    await addColumnIfNotExists(connection, dbName, 'order_items', 'product_image', "VARCHAR(500) NULL AFTER product_name");
    await addColumnIfNotExists(connection, dbName, 'order_items', 'variant_name', "VARCHAR(100) NULL AFTER product_image");
    await addColumnIfNotExists(connection, dbName, 'order_items', 'unit_price', "DECIMAL(12,2) NULL AFTER variant_name");
    await addColumnIfNotExists(connection, dbName, 'order_items', 'subtotal', "DECIMAL(12,2) NULL AFTER unit_price");

    // 4. cart_items
    console.log('Step 4: Checking cart_items table...');
    await addColumnIfNotExists(connection, dbName, 'cart_items', 'variant_id', "INT NULL AFTER product_id");

    // 5. products
    console.log('Step 5: Checking products table...');
    await addColumnIfNotExists(connection, dbName, 'products', 'thumbnail_url', "VARCHAR(500) NULL AFTER description");
    await addColumnIfNotExists(connection, dbName, 'products', 'base_price', "DECIMAL(12,2) NULL COMMENT 'Giá gốc'");
    await addColumnIfNotExists(connection, dbName, 'products', 'sale_price', "DECIMAL(12,2) NULL COMMENT 'Giá khuyến mãi'");
    await addColumnIfNotExists(connection, dbName, 'products', 'short_description', "TEXT NULL AFTER description");
    await addColumnIfNotExists(connection, dbName, 'products', 'slug', "VARCHAR(250) NULL AFTER name");
    await addColumnIfNotExists(connection, dbName, 'products', 'sku', "VARCHAR(100) NULL UNIQUE AFTER id");
    await addColumnIfNotExists(connection, dbName, 'products', 'brand', "VARCHAR(100) NULL");
    await addColumnIfNotExists(connection, dbName, 'products', 'is_active', "TINYINT(1) DEFAULT 1");
    await addColumnIfNotExists(connection, dbName, 'products', 'is_featured', "TINYINT(1) DEFAULT 0");
    await addColumnIfNotExists(connection, dbName, 'products', 'avg_rating', "DECIMAL(3,2) DEFAULT 0");
    await addColumnIfNotExists(connection, dbName, 'products', 'total_reviews', "INT DEFAULT 0");
    await addColumnIfNotExists(connection, dbName, 'products', 'total_sold', "INT DEFAULT 0");
    await addColumnIfNotExists(connection, dbName, 'products', 'discount_percent', "INT DEFAULT 0");

    // Check if products have base_price populated from price
    await connection.query("UPDATE products SET base_price = price WHERE base_price IS NULL AND price IS NOT NULL").catch(() => {});

    // 6. categories
    console.log('Step 6: Checking categories table...');
    await addColumnIfNotExists(connection, dbName, 'categories', 'parent_id', "INT NULL AFTER id");
    await addColumnIfNotExists(connection, dbName, 'categories', 'slug', "VARCHAR(150) NULL AFTER name");
    await addColumnIfNotExists(connection, dbName, 'categories', 'image_url', "VARCHAR(500) NULL");
    await addColumnIfNotExists(connection, dbName, 'categories', 'sort_order', "INT DEFAULT 0");
    await addColumnIfNotExists(connection, dbName, 'categories', 'is_active', "TINYINT(1) DEFAULT 1");

    // 7. reviews
    console.log('Step 7: Checking reviews table...');
    await addColumnIfNotExists(connection, dbName, 'reviews', 'title', "VARCHAR(200) NULL AFTER rating");
    await addColumnIfNotExists(connection, dbName, 'reviews', 'order_id', "INT NULL AFTER user_id");
    await addColumnIfNotExists(connection, dbName, 'reviews', 'is_verified', "TINYINT(1) DEFAULT 0");
    await addColumnIfNotExists(connection, dbName, 'reviews', 'is_visible', "TINYINT(1) DEFAULT 1");
    await addColumnIfNotExists(connection, dbName, 'reviews', 'helpful_count', "INT DEFAULT 0");

    console.log('\n--- VERIFICATION OF COLUMNS ---');
    const [ordCols] = await connection.query(`DESCRIBE orders`);
    console.log('Orders columns:', ordCols.map(c => c.Field).join(', '));

    console.log('\n✅ ALL DATABASE SCHEMA COLUMNS & TABLES ARE UP TO DATE!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await connection.end();
  }
}

runMigration();
