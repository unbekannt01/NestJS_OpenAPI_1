import { configService } from 'src/common/services/config.service';

export const emailTokenConfig = {
  expirationMs: parseInt(configService.getValue('EMAIL_VERIFICATION_TOKEN_EXPIRATION_MS'), 10),
};

export const otpExpiryConfig = {
  expirationOtp: parseInt(configService.getValue('OTP_EXPIRY'), 10),
};
