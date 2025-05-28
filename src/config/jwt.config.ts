import { configService } from "src/common/services/config.service";

export const jwtConfig = {
  secret: configService.getValue('JWT_SECRET'),
  expiresIn: configService.getValue('JWT_EXPIRES_IN'),
};