import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
    constructor(private readonly configService: ConfigService) { }

    async sendOtpEmail(email: string, otp: string, first_name: string) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true', // Convert to boolean
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });


        const mailOptions = {
            from: `"No Reply" <${this.configService.get<string>('SMTP_USER')}>`,
            to: email,
            subject: 'Your OTP for Login Verification',
            text: `Your OTP for verification is ${otp}.`,
            html: `
        <h1>Your OTP for Login Verification</h1>
        <p>Hello ${first_name},</p>
        <p>Your OTP is <strong>${otp}</strong>.</p>
        <p>Use this OTP to complete your login.</p>
        <p>Thank you.</p>
      `,
        };
        await transporter.sendMail(mailOptions);
    }
}
