export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') return '0 VNĐ';
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return '0 VNĐ';
  return `${new Intl.NumberFormat('vi-VN').format(num)} VNĐ`;
};

export const parseVndInput = (val: string | number | null | undefined): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    if (val > 0 && val < 100) return Math.round(val * 1000000);
    return val;
  }
  let str = String(val).trim();
  // Multiple dots or commas, e.g. 34.990.000 or 34,990,000
  if ((str.match(/[.,]/g) || []).length > 1) {
    str = str.replace(/[.,]/g, '');
    return parseFloat(str) || 0;
  }
  // Single dot or comma followed by exactly 3 digits, e.g. 500.000 or 500,000
  if (/^[0-9]+[.,][0-9]{3}$/.test(str)) {
    str = str.replace(/[.,]/g, '');
    return parseFloat(str) || 0;
  }
  const parsed = parseFloat(str.replace(/,/g, '.')) || 0;
  // If user entered e.g. 34.99 thinking in millions (< 100 with decimals)
  if (parsed > 0 && parsed < 100) {
    return Math.round(parsed * 1000000);
  }
  return parsed;
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    case 'shipped': return 'bg-purple-100 text-purple-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Chờ xử lý';
    case 'processing': return 'Đang chuẩn bị hàng';
    case 'shipped': return 'Đang giao hàng';
    case 'delivered': return 'Đã giao thành công';
    case 'cancelled': return 'Đã huỷ';
    default: return status;
  }
};
