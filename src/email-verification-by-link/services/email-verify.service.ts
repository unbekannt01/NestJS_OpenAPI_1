import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { smtpConfig } from 'src/config/smtp.config';

@Injectable()
export class EmailServiceForVerifyMail {
  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(
    email: string,
    verificationLink: string,
    first_name: string,
  ) {
    const transporter = nodemailer.createTransport(smtpConfig);

    const mailOptions = {
      from: `"Testing_Purpose" <${this.configService.get<string>('SMTP.USER')}>`,
      to: email,
      subject: '🔗 Verify Your Email Address',
      text: `Please verify your email by clicking this link: ${verificationLink}`,
      html: `
        <div style="background-color:#f4f4f4; padding:20px; font-family: Arial, sans-serif;">
          <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <tr>
              <td style="padding:20px; text-align:center;">
                <h1 style="color:#2c3e50; font-size:24px;">🔗 Email Verification</h1>
                <p style="color:#555; font-size:16px;">Hello <strong>${first_name}</strong>,</p>
                <p style="color:#333; font-size:18px;">Please verify your email address by clicking the button below:</p>
                <a href="${verificationLink}" style="background-color:#2c3e50; color:#ffffff; font-size:16px; font-weight:bold; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">Verify Email</a>
                <p style="color:#777; font-size:14px;">This link is valid for 24 hours.</a></p>
                <p style="color:#777; font-size:12px;">If you did not request this verification, please ignore this email.</p>
                <p style="color:#555; font-size:14px;"><strong>Thank you</strong></p>
              </td>
            </tr>
          </table>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  }
}
