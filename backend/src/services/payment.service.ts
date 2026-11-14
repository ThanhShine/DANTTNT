import crypto from 'crypto';
import { config } from '../config';

export interface VNPayOrderParams {
  orderCode: string;
  amount: number;
  ipAddr: string;
  orderInfo?: string;
}

export interface VietQRInfo {
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  orderCode: string;
  transferContent: string;
  qrCodeUrl: string;
}

/**
 * Format Date thành định dạng YYYYMMDDHHmmss theo múi giờ Việt Nam (GMT+7)
 */
function formatVNPayDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  // Chuyển sang GMT+7
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const vnDate = new Date(utc + 7 * 3600000);

  const year = vnDate.getFullYear();
  const month = pad(vnDate.getMonth() + 1);
  const day = pad(vnDate.getDate());
  const hours = pad(vnDate.getHours());
  const minutes = pad(vnDate.getMinutes());
  const seconds = pad(vnDate.getSeconds());

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Sắp xếp object theo key alphabet
 */
function sortObject(obj: Record<string, string | number>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      sorted[key] = String(obj[key]);
    }
  }
  return sorted;
}

/**
 * Build URL thanh toán VNPay
 */
export function buildVNPayUrl(params: VNPayOrderParams): string {
  const { orderCode, amount, ipAddr, orderInfo } = params;
  const createDate = formatVNPayDate(new Date());

  // VNPay tính đơn vị là VND * 100
  const vnpAmount = Math.round(amount * 100);

  const vnpParams: Record<string, string | number> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.vnpay.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderCode,
    vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderCode}`,
    vnp_OrderType: 'other',
    vnp_Amount: vnpAmount,
    vnp_ReturnUrl: config.vnpay.returnUrl,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
  };

  const sortedParams = sortObject(vnpParams);

  // Build chuỗi sign data
  const signDataParts: string[] = [];
  const queryParts: string[] = [];

  for (const key of Object.keys(sortedParams)) {
    const value = sortedParams[key];
    const encodedKey = encodeURIComponent(key);
    const encodedVal = encodeURIComponent(value).replace(/%20/g, '+');
    signDataParts.push(`${encodedKey}=${encodedVal}`);
    queryParts.push(`${encodedKey}=${encodedVal}`);
  }

  const signData = signDataParts.join('&');
  const hmac = crypto.createHmac('sha512', config.vnpay.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  queryParts.push(`vnp_SecureHash=${signed}`);

  return `${config.vnpay.url}?${queryParts.join('&')}`;
}

/**
 * Xác thực SecureHash khi VNPay callback hoặc IPN
 */
export function verifyVNPayReturn(queryParams: Record<string, any>): {
  isValid: boolean;
  orderCode: string;
  vnpResponseCode: string;
  vnpTransactionNo: string;
  amount: number;
  message: string;
} {
  const secureHash = queryParams['vnp_SecureHash'];
  const orderCode = queryParams['vnp_TxnRef'] || '';
  const vnpResponseCode = queryParams['vnp_ResponseCode'] || '';
  const vnpTransactionNo = queryParams['vnp_TransactionNo'] || '';
  const rawAmount = parseFloat(queryParams['vnp_Amount'] || '0');
  const amount = rawAmount / 100;

  if (!secureHash) {
    return {
      isValid: false,
      orderCode,
      vnpResponseCode,
      vnpTransactionNo,
      amount,
      message: 'Thiếu mã băm bảo mật vnp_SecureHash',
    };
  }

  // Lọc bỏ vnp_SecureHash & vnp_SecureHashType
  const cleanParams: Record<string, string> = {};
  for (const key of Object.keys(queryParams)) {
    if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && key.startsWith('vnp_')) {
      cleanParams[key] = queryParams[key];
    }
  }

  const sortedParams = sortObject(cleanParams);

  const signDataParts: string[] = [];
  for (const key of Object.keys(sortedParams)) {
    const value = sortedParams[key];
    const encodedKey = encodeURIComponent(key);
    const encodedVal = encodeURIComponent(value).replace(/%20/g, '+');
    signDataParts.push(`${encodedKey}=${encodedVal}`);
  }

  const signData = signDataParts.join('&');
  const hmac = crypto.createHmac('sha512', config.vnpay.hashSecret);
  const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const isValid = calculatedHash.toLowerCase() === secureHash.toLowerCase();

  return {
    isValid,
    orderCode,
    vnpResponseCode,
    vnpTransactionNo,
    amount,
    message: isValid
      ? (vnpResponseCode === '00' ? 'Giao dịch thành công' : `Giao dịch thất bại với mã lỗi ${vnpResponseCode}`)
      : 'Chữ ký bảo mật không hợp lệ (Dữ liệu có thể bị can thiệp)',
  };
}

/**
 * Sinh thông tin và đường dẫn mã VietQR chuẩn NAPAS 247
 */
export function generateVietQR(orderCode: string, amount: number): VietQRInfo {
  const { bankId, bankName, accountNo, accountName, template } = config.vietqr;
  const roundedAmount = Math.round(amount);
  const transferContent = orderCode;

  const qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${roundedAmount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(accountName)}`;

  return {
    bankId,
    bankName,
    accountNo,
    accountName,
    amount: roundedAmount,
    orderCode,
    transferContent,
    qrCodeUrl,
  };
}
