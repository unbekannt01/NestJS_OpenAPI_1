import { registerAs } from "@nestjs/config";

export const SMTP_CONFIG = registerAs("SMTP", ()=>{
    return {
        HOST : process.env['SMTP_HOST'],
        PORT : process.env['SMTP_PORT'],
        USER : process.env['SMTP_USER'],
        PASSWORD : process.env['SMTP_PASS'],
        SECURE : process.env['SMTP_SECURE'] || 'false'
    }
})