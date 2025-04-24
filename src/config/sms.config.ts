import { registerAs } from "@nestjs/config";

export const SMS = registerAs("TWILLIO", ()=>{
    return {
        ACCOUNT_SID : process.env['TWILIO_ACCOUNT_SID'],
        AUTH_TOKEN : process.env['TWILIO_AUTH_TOKEN'],
        PHONE_NUMBER : process.env['TWILIO_PHONE_NUMBER'],
        VERIFY_SERVICE_SID : process.env['TWILIO_VERIFY_SERVICE_SID']
    }
})