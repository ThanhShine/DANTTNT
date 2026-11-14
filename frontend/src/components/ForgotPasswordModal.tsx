import React, { useState, useEffect } from 'react';
import { KeyRound, Mail, Lock, X, Loader2, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { authService } from '../services';
import toast from 'react-hot-toast';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // Bước 1: Gửi OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Vui lòng nhập địa chỉ email');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      toast.success('Mã xác thực OTP đã được gửi đến email của bạn! Vui lòng kiểm tra hộp thư.');
      setStep(2);
      setCountdown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi mã OTP');
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      toast.success('Đã gửi lại mã OTP mới vào email!');
      setCountdown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi khi gửi lại mã OTP');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác nhận OTP & Đổi mật khẩu
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Vui lòng nhập mã OTP 6 số');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });

      toast.success('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      if (onSuccess) onSuccess(email.trim());
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <KeyRound className="text-primary-600" size={20} />
            <h2 className="font-bold text-gray-900 text-base">
              {step === 1 ? 'Quên mật khẩu' : 'Xác thực OTP & Mật khẩu mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Nhập Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="p-6 space-y-4 text-sm">
            <p className="text-xs text-gray-500 leading-relaxed">
              Nhập địa chỉ email liên kết với tài khoản của bạn. Hệ thống sẽ gửi một mã OTP gồm 6 chữ số để xác thực đặt lại mật khẩu.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Địa chỉ Email</label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-primary-600/20"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang gửi mã...
                </>
              ) : (
                <>
                  Tiếp tục nhận mã OTP <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Nhập OTP & Đặt mật khẩu mới */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="p-6 space-y-4 text-sm">
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-xs text-primary-800">
              Mã xác thực 6 số đã được gửi tới: <strong>{email}</strong>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="block text-primary-600 hover:underline mt-1 font-semibold"
              >
                Đổi email khác
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Mã xác thực OTP (6 chữ số) *
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center py-2.5 border border-gray-300 rounded-lg text-2xl font-mono tracking-widest font-black focus:ring-primary-500 focus:border-primary-500 bg-gray-50/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mật khẩu mới *</label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Xác nhận mật khẩu mới *</label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>Chưa nhận được mã?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || loading}
                className="text-primary-600 hover:text-primary-700 font-bold disabled:text-gray-400"
              >
                {countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại mã OTP'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-primary-600/20"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang xử lý...
                </>
              ) : (
                'Xác nhận & Đặt lại mật khẩu'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
