import React, { useState } from 'react';
import { RotateCcw, X, AlertCircle, Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { returnService } from '../services';
import toast from 'react-hot-toast';

interface ReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | string;
  orderCode: string;
  onSuccess: () => void;
}

const COMMON_REASONS = [
  'Sản phẩm bị móp méo, trầy xước hoặc hư hỏng do vận chuyển',
  'Giao sai sản phẩm, sai màu sắc hoặc phiên bản dung lượng',
  'Sản phẩm bị lỗi kỹ thuật, không hoạt động bình thường',
  'Sản phẩm không đúng với thông tin, hình ảnh mô tả',
  'Thiếu linh kiện, quà tặng hoặc phụ kiện đi kèm',
  'Khác (vui lòng mô tả chi tiết)',
];

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderCode,
  onSuccess,
}) => {
  const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund');
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [bankName, setBankName] = useState('MB Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddImageUrl = () => {
    if (imageUrls.length >= 4) return;
    setImageUrls([...imageUrls, '']);
  };

  const handleUpdateImageUrl = (index: number, val: string) => {
    const updated = [...imageUrls];
    updated[index] = val;
    setImageUrls(updated);
  };

  const handleRemoveImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Vui lòng chọn hoặc nhập lý do yêu cầu');
      return;
    }

    if (returnType === 'refund') {
      if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
        toast.error('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng để nhận tiền hoàn');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const validImages = imageUrls.map(u => u.trim()).filter(Boolean);
      await returnService.requestReturn(orderId, {
        return_type: returnType,
        reason: reason.trim(),
        description: description.trim() || undefined,
        images: validImages.length > 0 ? validImages : undefined,
        bank_info: returnType === 'refund' ? {
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          account_holder: accountHolder.trim().toUpperCase(),
        } : undefined,
      });

      toast.success('Gửi yêu cầu đổi/trả hàng thành công! Đội ngũ CSKH sẽ liên hệ hỗ trợ bạn sớm.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu đổi/trả');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <RotateCcw className="text-primary-600" size={20} />
            <h2 className="font-bold text-gray-900 text-base">Yêu cầu Đổi / Trả hàng & Hoàn tiền</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              Đang tạo yêu cầu cho đơn hàng <strong className="font-mono">#{orderCode}</strong>.
              Chính sách đổi trả áp dụng trong vòng 7 ngày kể từ khi nhận hàng.
            </div>
          </div>

          {/* Chọn loại yêu cầu */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Hình thức mong muốn *</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer text-xs font-bold transition ${
                returnType === 'refund'
                  ? 'border-primary-600 bg-primary-50/50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="returnType"
                  value="refund"
                  checked={returnType === 'refund'}
                  onChange={() => setReturnType('refund')}
                  className="sr-only"
                />
                💰 Trả hàng & Hoàn tiền
              </label>

              <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer text-xs font-bold transition ${
                returnType === 'exchange'
                  ? 'border-primary-600 bg-primary-50/50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="returnType"
                  value="exchange"
                  checked={returnType === 'exchange'}
                  onChange={() => setReturnType('exchange')}
                  className="sr-only"
                />
                🔄 Đổi sản phẩm mới
              </label>
            </div>
          </div>

          {/* Lý do */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Lý do đổi trả *</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-medium focus:ring-primary-500 focus:border-primary-500"
            >
              {COMMON_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mô tả chi tiết tình trạng sản phẩm</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="VD: Mặt sau máy có vết xước dài 3cm, hộp bọc ngoài bị rách..."
              className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Hình ảnh chứng minh */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 uppercase">Hình ảnh bằng chứng (URL)</label>
              {imageUrls.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-0.5"
                >
                  <Plus size={12} /> Thêm ảnh
                </button>
              )}
            </div>
            <div className="space-y-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={e => handleUpdateImageUrl(index, e.target.value)}
                    placeholder="https://example.com/anh-loi.jpg"
                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-primary-500 focus:border-primary-500"
                  />
                  {imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImageUrl(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Thông tin tài khoản nhận tiền hoàn (Nếu chọn refund) */}
          {returnType === 'refund' && (
            <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-3.5 space-y-3">
              <h4 className="text-xs font-bold text-purple-900 uppercase flex items-center gap-1.5">
                💳 Thông tin nhận tiền hoàn chuyển khoản
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Ngân hàng *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="VD: MB Bank, Vietcombank..."
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                    required={returnType === 'refund'}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Số tài khoản *</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Số tài khoản..."
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-mono"
                    required={returnType === 'refund'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Tên chủ tài khoản (In hoa) *</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value.toUpperCase())}
                  placeholder="NGUYEN VAN A"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-mono uppercase"
                  required={returnType === 'refund'}
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-primary-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Đang gửi yêu cầu...
                </>
              ) : (
                'Gửi yêu cầu đổi trả'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnRequestModal;
