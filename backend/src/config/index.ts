import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env:     process.env.NODE_ENV  || 'development',
  port:    parseInt(process.env.PORT || '5000', 10),

  jwt: {
    secret:         process.env.JWT_SECRET         || 'fallback_secret_change_me',
    expiresIn:      process.env.JWT_EXPIRES_IN      || '7d',
    refreshSecret:  process.env.JWT_REFRESH_SECRET  || 'fallback_refresh_secret',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  upload: {
    dir:         process.env.UPLOAD_DIR          || 'uploads',
    maxSizeMb:   parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  },

  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS     || '900000', 10),
    max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS  || '100', 10),
  },

  vnpay: {
    tmnCode:    process.env.VNPAY_TMN_CODE    || 'CGXZLS0Z',
    hashSecret: process.env.VNPAY_HASH_SECRET || 'XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN',
    url:        process.env.VNPAY_URL         || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl:  process.env.VNPAY_RETURN_URL  || 'http://localhost:3000/payment/vnpay-return',
  },

  vietqr: {
    bankId:      process.env.VIETQR_BANK_ID      || 'MB',
    bankName:    process.env.VIETQR_BANK_NAME    || 'Ngân hàng Quân Đội (MB Bank)',
    accountNo:   process.env.VIETQR_ACCOUNT_NO   || '0777498884',
    accountName: process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN HOANG THANH',
    template:    process.env.VIETQR_TEMPLATE     || 'compact2',
  },

  email: {
    host:       process.env.SMTP_HOST        || 'smtp.gmail.com',
    port:       parseInt(process.env.SMTP_PORT || '587', 10),
    secure:     process.env.SMTP_SECURE === 'true',
    user:       process.env.SMTP_USER        || '',
    pass:       process.env.SMTP_PASS        || '',
    from:       process.env.EMAIL_FROM       || '"Sales AI E-Commerce" <noreply@salesai.vn>',
  },
} as const;

