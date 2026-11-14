import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { paymentService } from '../services';
import { formatCurrency } from '../utils/format';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShoppingBag, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReturnResult {
  orderId?: number;
  orderCode?: string;
  amount?: number;
  transactionNo?: string;
  paymentStatus?: string;
  message?: string;
  responseCode?: string;
}

const VNPayReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [result, setResult] = useState<ReturnResult | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      // Chuyển toàn bộ query params sang object
      const params: Record<string, string> = {};
      searchParams.forEach((val, key) => {
        params[key] = val;
      });

      if (!params['vnp_SecureHash'] || !params['vnp_TxnRef']) {
        setLoading(false);
        setIsSuccess(false);
        setResult({
          message: 'Không tìm thấy thông tin giao dịch hợp lệ từ cổng thanh toán VNPay.',
        });
        return;
      }

      try {
        const res = await paymentService.verifyVNPayReturn(params);
        setIsSuccess(true);
        setResult(res.data.data as ReturnResult);
        toast.success('Thanh toán đơn hàng thành công!');
      } catch (err: any) {
        setIsSuccess(false);
        const data = err.response?.data?.data || {};
        setResult({
          ...data,
          message: err.response?.data?.message || 'Giao dịch thanh toán không thành công hoặc đã bị huỷ.',
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Đang đối soát kết quả từ VNPay...</h2>
        <p className="text-gray-500 text-sm mt-1">Vui lòng không tắt hoặc tải lại trang.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-center p-8 sm:p-10">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Thanh Toán Thành Công!</h1>
            <p className="text-gray-600 mb-6">
              Đơn hàng của bạn đã được thanh toán hoàn tất qua cổng **VNPay**. Shop đang tiến hành chuẩn bị đơn hàng!
            </p>

            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-xl p-5 mb-8 text-left space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Mã đơn hàng:</span>
                <span className="font-bold text-gray-900">{result?.orderCode || 'N/A'}</span>
              </div>
              {result?.transactionNo && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Mã giao dịch VNPay:</span>
                  <span className="font-mono text-gray-800">{result.transactionNo}</span>
                </div>
              )}
              {result?.amount !== undefined && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Số tiền đã thanh toán:</span>
                  <span className="font-bold text-red-600 text-base">{formatCurrency(result.amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Phương thức:</span>
                <span className="font-medium text-blue-600">Cổng thanh toán VNPay (Đã thanh toán)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {result?.orderId ? (
                <button
                  onClick={() => navigate(`/orders/${result.orderId}`)}
                  className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition flex items-center justify-center"
                >
                  Xem chi tiết đơn hàng <ArrowRight size={18} className="ml-2" />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/orders')}
                  className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition flex items-center justify-center"
                >
                  Danh sách đơn hàng <ArrowRight size={18} className="ml-2" />
                </button>
              )}
              <Link
                to="/products"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition flex items-center justify-center"
              >
                <ShoppingBag size={18} className="mr-2" /> Tiếp tục mua sắm
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle size={48} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Thanh Toán Không Thành Công</h1>
            <p className="text-gray-600 mb-6">
              {result?.message || 'Giao dịch qua VNPay đã bị huỷ hoặc có lỗi xảy ra trong quá trình xử lý.'}
            </p>

            {/* Error Details */}
            {result?.orderCode && (
              <div className="bg-gray-50 rounded-xl p-5 mb-8 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã đơn hàng:</span>
                  <span className="font-bold text-gray-900">{result.orderCode}</span>
                </div>
                {result?.responseCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mã phản hồi VNPay:</span>
                    <span className="font-mono text-red-600">{result.responseCode}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className="text-red-500 font-medium">Chưa thanh toán</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {result?.orderId ? (
                <button
                  onClick={() => navigate(`/orders/${result.orderId}`)}
                  className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition flex items-center justify-center"
                >
                  <RotateCcw size={18} className="mr-2" /> Thử thanh toán lại
                </button>
              ) : (
                <button
                  onClick={() => navigate('/orders')}
                  className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition flex items-center justify-center"
                >
                  Xem danh sách đơn hàng
                </button>
              )}
              <Link
                to="/"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Về trang chủ
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VNPayReturnPage;
