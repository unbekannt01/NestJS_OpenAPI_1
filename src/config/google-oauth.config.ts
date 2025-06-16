// google-oauth.config.ts
import { configService } from "src/common/services/config.service";

export const googleOAuthConfig = {
  clientId: configService.getValue('GOOGLE_CLIENT_ID'),
  clientSecret: configService.getValue('GOOGLE_CLIENT_SECRET'),
  callbackUrl: configService.getValue('GOOGLE_CALLBACK_URL'),
};

// /**
//  * Google Configuration
//  * Configuration for Google Identity Services integration
//  */
// export interface GoogleConfig {
//   clientId: string
//   // Note: No client secret needed for script-based approach
// }

// export const googleConfig = (): GoogleConfig => ({
//   clientId: process.env.GOOGLE_CLIENT_ID || "",
// })

// // Validation function
// export const validateGoogleConfig = () => {
//   if (!process.env.GOOGLE_CLIENT_ID) {
//     throw new Error("GOOGLE_CLIENT_ID environment variable is required")
//   }
// }

