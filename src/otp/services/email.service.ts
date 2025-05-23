import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * EmailServiceForVerifyMail
 * This service is responsible for sending verification emails to users.
 */
@Injectable()
export class EmailServiceForOTP {
  constructor(private readonly configService: ConfigService) {}

  async sendOtpEmail(email: string, otp: string, first_name: string) {
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
      from: `"Testing_Purpose" <${this.configService.get<string>('SMTP.USER')}>`,
      to: email,
      subject: '🔐 Your OTP for Secure Login',
      text: `Your OTP for verification is ${otp}.`,
      html: `
        <div style="background-color:#f4f4f4; padding:20px; font-family: Arial, sans-serif;">
          <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <tr>
              <td style="padding:20px; text-align:center;">
                <h1 style="color:#2c3e50; font-size:24px;">🔒 Secure Login OTP</h1>
                <p style="color:#555; font-size:16px;">Hello <strong>${first_name}</strong>,</p>
                <p style="color:#333; font-size:18px;">Your One-Time Password (OTP) is:</p>
                <p style="background-color:#2c3e50; color:#ffffff; font-size:24px; font-weight:bold; padding:10px 20px; border-radius:5px; display:inline-block;">${otp}</p>
                <p style="color:#777; font-size:14px;">This OTP is valid for only a few minutes. Do not share it with anyone.</p>
                <p style="color:#777; font-size:12px;">If you did not request this OTP, please ignore this email.</p>
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
