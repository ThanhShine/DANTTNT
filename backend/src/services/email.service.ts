import nodemailer from 'nodemailer';
import { config } from '../config';

interface OrderEmailItem {
  name: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderConfirmationEmailParams {
  toEmail: string;
  customerName: string;
  orderCode: string;
  createdAt: string | Date;
  items: OrderEmailItem[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: {
    recipient_name?: string;
    recipient_phone?: string;
    address_detail?: string;
    ward?: string;
    district?: string;
    province?: string;
  };
  orderUrl?: string;
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

class EmailService {
  private transporter: any = null;
  private isConfigured = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (config.email.user && config.email.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
      this.isConfigured = true;
      console.log('📧 EmailService: SMTP transporter configured with user:', config.email.user);
    } else {
      this.isConfigured = false;
      console.log('ℹ️ EmailService: SMTP not configured in .env. Running in Sandbox Mock mode (Console logging).');
    }
  }

  /**
   * Gửi email xác nhận đặt hàng thành công
   */
  async sendOrderConfirmation(params: OrderConfirmationEmailParams): Promise<boolean> {
    const {
      toEmail, customerName, orderCode, items, subtotal, discountAmount = 0,
      couponCode, shippingFee, totalAmount, paymentMethod, shippingAddress, orderUrl
    } = params;

    const paymentLabel = paymentMethod === 'BANK_TRANSFER'
      ? 'Chuyển khoản Ngân hàng VietQR 24/7'
      : paymentMethod === 'VNPAY'
      ? 'Cổng thanh toán điện tử VNPay'
      : 'Thanh toán tiền mặt khi nhận hàng (COD)';

    const fullAddress = [
      shippingAddress?.address_detail,
      shippingAddress?.ward,
      shippingAddress?.district,
      shippingAddress?.province
    ].filter(Boolean).join(', ');

    const itemsRowsHtml = items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; text-align: center; color: #64748b; font-size: 13px;">${idx + 1}</td>
        <td style="padding: 12px 8px;">
          <strong style="color: #1e293b; font-size: 14px;">${item.name}</strong>
          ${item.variantName ? `<br><span style="color: #6d28d9; font-size: 12px; font-weight: 500;">Phân loại: ${item.variantName}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; text-align: right; color: #475569; font-size: 13px;">${fmtCurrency(item.unitPrice)}</td>
        <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: #1e293b; font-size: 13px;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #1e293b; font-size: 13px;">${fmtCurrency(item.subtotal)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 24px 0; margin: 0; color: #334155; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <div style="display: inline-block; width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; line-height: 44px; font-size: 22px; font-weight: bold; margin-bottom: 12px;">
              S
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">XÁC NHẬN ĐƠN HÀNG THÀNH CÔNG</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Cảm ơn bạn đã tin tưởng mua sắm tại Sales AI</p>
          </div>

          <!-- Body -->
          <div style="padding: 28px 24px;">
            <p style="font-size: 15px; margin-top: 0;">Xin chào <strong>${customerName || 'Quý khách'}</strong>,</p>
            <p style="font-size: 14px; color: #475569;">
              Đơn hàng của bạn với mã <strong style="color: #7c3aed; font-family: monospace; font-size: 15px;">#${orderCode}</strong> đã được hệ thống ghi nhận thành công và đang được chuẩn bị để giao đến bạn sớm nhất.
            </p>

            <!-- Order Meta Box -->
            <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
              <div style="margin-bottom: 8px;"><strong>Mã đơn hàng:</strong> <span style="font-family: monospace; color: #1e293b;">#${orderCode}</span></div>
              <div style="margin-bottom: 8px;"><strong>Phương thức thanh toán:</strong> ${paymentLabel}</div>
              <div style="margin-bottom: 8px;"><strong>Người nhận:</strong> ${shippingAddress?.recipient_name || customerName} - ${shippingAddress?.recipient_phone || '—'}</div>
              <div><strong>Địa chỉ giao hàng:</strong> ${fullAddress || 'Địa chỉ tiêu chuẩn'}</div>
            </div>

            <!-- Products Table -->
            <h3 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 24px 0 12px 0;">Chi tiết sản phẩm</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; font-size: 12px; color: #475569; text-transform: uppercase;">
                  <th style="padding: 10px 8px; text-align: center;">STT</th>
                  <th style="padding: 10px 8px; text-align: left;">Sản phẩm</th>
                  <th style="padding: 10px 8px; text-align: right;">Đơn giá</th>
                  <th style="padding: 10px 8px; text-align: center;">SL</th>
                  <th style="padding: 10px 8px; text-align: right;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>

            <!-- Financials Summary -->
            <div style="background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #64748b;">Tổng tiền hàng:</span>
                <span style="font-weight: 600;">${fmtCurrency(subtotal)}</span>
              </div>
              ${discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #16a34a;">
                  <span>Giảm giá (${couponCode || 'Voucher'}):</span>
                  <span style="font-weight: 600;">-${fmtCurrency(discountAmount)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Phí vận chuyển:</span>
                <span style="font-weight: 600; color: ${shippingFee === 0 ? '#16a34a' : '#1e293b'};">
                  ${shippingFee === 0 ? 'Miễn phí' : fmtCurrency(shippingFee)}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #e9d5ff; padding-top: 10px; font-size: 16px;">
                <strong style="color: #581c87;">Tổng thanh toán:</strong>
                <strong style="color: #dc2626; font-size: 18px;">${fmtCurrency(totalAmount)}</strong>
              </div>
            </div>

            <!-- Button CTA -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${orderUrl || 'http://localhost:3000/orders'}" style="background: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(124,58,237,0.3);">
                Xem Chi Tiết Đơn Hàng & Tra Cứu Vận Đơn
              </a>
            </div>

            <p style="font-size: 13px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              Nếu bạn có bất kỳ thắc mắc nào, vui lòng phản hồi email này hoặc liên hệ hotline chăm sóc khách hàng <strong>1900 6868</strong> để được hỗ trợ 24/7.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            Sales AI E-Commerce • Nền tảng bán hàng thông minh tích hợp Trí tuệ nhân tạo<br>
            Trụ sở: 123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh
          </div>
        </div>
      </div>
    `;

    if (this.isConfigured && this.transporter) {
      try {
        await this.transporter.sendMail({
          from: config.email.from,
          to: toEmail,
          subject: `[Sales AI] Xác nhận đơn hàng #${orderCode} thành công`,
          html: htmlContent,
        });
        console.log(`✅ Order confirmation email successfully sent to ${toEmail}`);
        return true;
      } catch (err: any) {
        console.error('❌ Failed to send order confirmation email:', err.message);
        return false;
      }
    } else {
      console.log(`[MOCK EMAIL] To: ${toEmail} | Subject: [Sales AI] Xác nhận đơn hàng #${orderCode}`);
      return true;
    }
  }

  /**
   * Gửi email OTP đặt lại mật khẩu (Forgot Password)
   */
  async sendPasswordResetOtp(toEmail: string, otpCode: string, recipientName = 'Quý khách'): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 32px 0; margin: 0; color: #334155; line-height: 1.6;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 28px; margin-bottom: 6px;">🔐</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">MÃ XÁC THỰC ĐẶT LẠI MẬT KHẨU</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Sales AI Security Team</p>
          </div>

          <div style="padding: 28px 24px;">
            <p style="font-size: 14px; margin-top: 0;">Xin chào <strong>${recipientName}</strong>,</p>
            <p style="font-size: 14px; color: #475569;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email <strong>${toEmail}</strong> trên hệ thống Sales AI.
            </p>
            <p style="font-size: 14px; color: #475569;">
              Dưới đây là mã xác thực OTP (One-Time Password) của bạn:
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <div style="display: inline-block; background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 14px 32px; font-family: monospace; font-size: 32px; font-weight: 800; color: #1d4ed8; letter-spacing: 8px;">
                ${otpCode}
              </div>
              <p style="font-size: 12px; color: #dc2626; margin-top: 10px; font-weight: 600;">
                ⏱️ Mã có hiệu lực trong vòng 10 phút.
              </p>
            </div>

            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 6px; font-size: 12px; color: #92400e; margin-bottom: 20px;">
              <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai, bao gồm cả nhân viên hỗ trợ của Sales AI. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            </div>

            <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">
              Sales AI E-Commerce Security System
            </p>
          </div>
        </div>
      </div>
    `;

    if (this.isConfigured && this.transporter) {
      try {
        await this.transporter.sendMail({
          from: config.email.from,
          to: toEmail,
          subject: `[Sales AI] Mã OTP đặt lại mật khẩu của bạn là ${otpCode}`,
          html: htmlContent,
        });
        console.log(`✅ Password reset OTP sent to ${toEmail}`);
        return true;
      } catch (err: any) {
        console.error('❌ Failed to send password reset OTP:', err.message);
        return false;
      }
    } else {
      console.log(`\n========================================================`);
      console.log(`[MOCK EMAIL OTP] To: ${toEmail}`);
      console.log(`[MOCK EMAIL OTP] CODE: >>> ${otpCode} <<<`);
      console.log(`========================================================\n`);
      return true;
    }
  }
}

export const emailService = new EmailService();
