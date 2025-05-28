// google-oauth.config.ts
import { configService } from "src/common/services/config.service";

export const googleOAuthConfig = {
  clientId: configService.getValue('GOOGLE_CLIENT_ID'),
  projectId: configService.getValue('GOOGLE_PROJECT_ID'),
  clientSecret: configService.getValue('GOOGLE_CLIENT_SECRET'),
  callbackUrl: configService.getValue('GOOGLE_CALLBACK_URL'),
};
