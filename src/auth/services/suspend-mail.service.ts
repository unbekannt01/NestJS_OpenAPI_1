import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * EmailServiceForSuspension
 * This service is responsible for sending suspension emails to users.
 */
@Injectable()
export class EmailServiceForSupension {
  constructor(
    private readonly configService: ConfigService
  ) { }

  async sendSuspensionEmail(email: string, first_name: string, message: string) {
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP.HOST'),
      port: parseInt(this.configService.get<string>('SMTP.PORT') || '587'),
      secure: this.configService.get<string>('SMTP.SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP.USER'),
        pass: this.configService.get<string>('SMTP.PASSWORD'),
      },
    });
  
    const mailOptions = {
      from: `"Account Suspension" <${this.configService.get<string>('SMTP.USER')}>`,
      to: email,
      subject: '⚠️ Account Suspension Notice',
      text: `Dear ${first_name}, your account has been suspended due to policy violations. Reason: ${message}`,
      html: `
        <div style="background-color:#f4f4f4; padding:20px; font-family: Arial, sans-serif;">
          <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <tr>
              <td style="padding:20px; text-align:center;">
                <h1 style="color:#c0392b; font-size:24px;">⚠️ Account Suspended</h1>
                <p style="color:#555; font-size:16px;">Hello <strong>${first_name}</strong>,</p>
                <p style="color:#333; font-size:18px;">We regret to inform you that your account has been <strong>suspended</strong> due to a violation of our terms and policies.</p>
                <p style="color:#e74c3c; font-size:16px;"><strong>Reason:</strong> ${message}</p>
                <p style="color:#777; font-size:14px;">If you believe this was a mistake or wish to appeal, please contact our support team.</p>
                <p style="color:#555; font-size:14px;"><strong>Thank you for your understanding.</strong></p>
              </td>
            </tr>
          </table>
        </div>
      `,
    };
  
    await transporter.sendMail(mailOptions);
  }
  
}
