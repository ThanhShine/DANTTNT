import React from 'react';
import { Printer, X, CheckCircle2, QrCode } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';

interface InvoiceItem {
  id: number | string;
  name: string;
  variant_name?: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

interface InvoiceAddress {
  recipient_name?: string;
  recipient_phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  address_detail?: string;
}

export interface InvoiceData {
  order_id: number | string;
  order_code: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_method: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_note?: string;
  shipping_address: InvoiceAddress;
  items: InvoiceItem[];
  subtotal: number;
  discount_amount?: number;
  coupon_code?: string;
  shipping_fee: number;
  total_amount: number;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
}

// Chuyển số tiền thành chữ tiếng Việt
function numberToWordsVietnamese(total: number): string {
  if (!total || total <= 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroupThree(n: number): string {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;
    let res = '';

    if (hundred > 0 || ten > 0 || unit > 0) {
      res += digits[hundred] + ' trăm ';
      if (ten === 0 && unit > 0) res += 'lẻ ';
      if (ten === 1) res += 'mười ';
      if (ten > 1) res += digits[ten] + ' mươi ';
      if (unit === 1 && ten > 1) res += 'mốt ';
      else if (unit === 5 && ten >= 1) res += 'lăm ';
      else if (unit > 0) res += digits[unit] + ' ';
    }
    return res;
  }

  let num = Math.round(total);
  const groups: number[] = [];
  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  let words = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g > 0) {
      words += readGroupThree(g) + units[i] + ' ';
    }
  }

  words = words.trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) + ' đồng chẵn.' : 'Không đồng.';
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, invoice }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'BANK_TRANSFER': return 'Chuyển khoản VietQR 24/7';
      case 'VNPAY': return 'Cổng thanh toán điện tử VNPay';
      case 'COD': return 'Thanh toán tiền mặt khi nhận hàng (COD)';
      default: return method || 'Thanh toán khi nhận hàng';
    }
  };

  const isPaid = invoice.payment_status === 'paid';
  const addr = invoice.shipping_address || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="text-primary-600" size={20} />
            <h2 className="font-bold text-gray-800 text-base">Xem trước Hóa Đơn & Phiếu Giao Hàng</h2>
            <span className="text-xs bg-primary-100 text-primary-800 font-mono px-2 py-0.5 rounded font-bold">
              #{invoice.order_code}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-600/20 transition cursor-pointer"
            >
              <Printer size={16} /> In Hóa Đơn / Xuất PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white print:p-6 print:overflow-visible text-gray-800 text-sm">
          {/* Header */}
          <div className="border-b-2 border-gray-900 pb-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-black text-lg">
                    S
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900">SALES AI E-COMMERCE</h1>
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Hệ thống phân phối thiết bị công nghệ & phụ kiện cao cấp</p>
                <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                  <p>📍 Trụ sở: 123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
                  <p>☎️ Hotline CSKH: 1900 6868 • 🌐 Website: salesai.store</p>
                  <p>📋 Mã số thuế: 0312345678-001</p>
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-wide uppercase">
                  HÓA ĐƠN BÁN HÀNG
                </h2>
                <p className="text-xs text-gray-500 mt-1">KIÊM PHIẾU XUẤT KHO & GIAO HÀNG</p>
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <p>Mã đơn hàng: <strong className="font-mono text-gray-900 text-sm">#{invoice.order_code}</strong></p>
                  <p>Ngày lập: <span>{formatDate(invoice.created_at)}</span></p>
                  <p className="flex items-center sm:justify-end gap-1">
                    Trạng thái: 
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isPaid ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN (COD)'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 mb-6 border-b border-gray-200">
            <div>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                THÔNG TIN NGƯỜI NHẬN HÀNG
              </h3>
              <p className="font-bold text-gray-900 text-base">{addr.recipient_name || invoice.customer_name || 'Khách hàng'}</p>
              <p className="text-sm text-gray-600 mt-1">📞 Số điện thoại: <strong>{addr.recipient_phone || invoice.customer_phone || '—'}</strong></p>
              <p className="text-sm text-gray-600 mt-1">
                📍 Địa chỉ: {addr.address_detail ? `${addr.address_detail}, ` : ''}
                {[addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
              </p>
              {invoice.customer_note && (
                <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded mt-2 border border-amber-200">
                  <strong>Ghi chú đơn:</strong> {invoice.customer_note}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                PHƯƠNG THỨC & GIAO DỊCH
              </h3>
              <div className="space-y-1.5 text-xs text-gray-600">
                <p>Phương thức thanh toán: <strong className="text-gray-900">{getPaymentMethodLabel(invoice.payment_method)}</strong></p>
                <p>Đơn vị vận chuyển: <strong className="text-gray-900">Giao Hàng Hỏa Tốc Toàn Quốc</strong></p>
                <p>Email liên hệ: <span className="text-gray-900">{invoice.customer_email || '—'}</span></p>
                <div className="mt-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Quý khách vui lòng kiểm tra kỹ sản phẩm, tem niêm phong và đối chiếu số lượng trước khi nhận hàng.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
              CHI TIẾT SẢN PHẨM MUA HÀNG
            </h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-y-2 border-gray-900 text-xs font-black text-gray-700 uppercase bg-gray-50/50">
                  <th className="py-2.5 px-3 text-center w-12">STT</th>
                  <th className="py-2.5 px-3">Tên sản phẩm</th>
                  <th className="py-2.5 px-3">Phân loại</th>
                  <th className="py-2.5 px-3 text-right">Đơn giá</th>
                  <th className="py-2.5 px-3 text-center w-16">SL</th>
                  <th className="py-2.5 px-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3 text-center text-gray-500">{index + 1}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900">{item.name}</td>
                      <td className="py-3 px-3 text-gray-500">{item.variant_name || '—'}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 px-3 text-center font-bold text-gray-900">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-400">Không có dữ liệu sản phẩm</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t-2 border-gray-900 pt-4 mb-8">
            <div className="w-full sm:w-1/2 space-y-2">
              <p className="text-xs text-gray-600">
                <strong>Bằng chữ: </strong>
                <span className="italic text-gray-800">{numberToWordsVietnamese(invoice.total_amount)}</span>
              </p>
              {isPaid ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>Đơn hàng đã được thanh toán đầy đủ trực tuyến. Shipper không thu thêm bất kỳ khoản phí nào.</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <span>Khách hàng thanh toán tiền mặt (COD) cho nhân viên giao hàng đúng số tiền tổng thanh toán.</span>
                </div>
              )}
            </div>

            <div className="w-full sm:w-2/5 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Tổng tiền hàng:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {Boolean(invoice.discount_amount && invoice.discount_amount > 0) && (
                <div className="flex justify-between py-1 text-emerald-600 border-b border-gray-100">
                  <span>Giảm giá ({invoice.coupon_code || 'Voucher'}):</span>
                  <span className="font-semibold">-{formatCurrency(invoice.discount_amount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span className="font-semibold text-gray-900">
                  {invoice.shipping_fee === 0 ? 'Miễn phí' : formatCurrency(invoice.shipping_fee)}
                </span>
              </div>
              <div className="flex justify-between py-2 items-baseline text-sm">
                <span className="font-black text-gray-900 uppercase">TỔNG THANH TOÁN:</span>
                <span className="text-xl font-black text-red-600">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Signature Sign-offs */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs pt-4 mb-8">
            <div>
              <p className="font-bold text-gray-900 uppercase">NGƯỜI MUA HÀNG</p>
              <p className="text-[11px] text-gray-400 italic mt-0.5">(Ký & ghi rõ họ tên)</p>
              <div className="h-16" />
            </div>
            <div>
              <p className="font-bold text-gray-900 uppercase">NGƯỜI GIAO HÀNG</p>
              <p className="text-[11px] text-gray-400 italic mt-0.5">(Ký & ghi rõ họ tên)</p>
              <div className="h-16" />
            </div>
            <div>
              <p className="font-bold text-gray-900 uppercase">ĐẠI DIỆN SALES AI</p>
              <p className="text-[11px] text-gray-400 italic mt-0.5">(Ký duyệt & đóng dấu)</p>
              <div className="h-16 flex items-center justify-center">
                <span className="font-serif italic font-bold text-red-600/80 border-2 border-red-500/80 px-2 py-1 rounded rotate-[-6deg]">
                  ĐÃ XÁC NHẬN
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-gray-200 pt-4 text-center text-[11px] text-gray-400">
            Cảm ơn quý khách đã mua sắm tại Sales AI! Chúc quý khách có những trải nghiệm tuyệt vời cùng sản phẩm.
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
