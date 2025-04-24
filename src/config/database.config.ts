import { registerAs } from "@nestjs/config";

export const DATABASE_CONFIG = registerAs("DATABASE", () => {
    return {
        USER: process.env['DB_USER'],
        PASSWORD: process.env['DB_PASSWORD'],
        HOST: process.env['DB_HOST'],
        NAME: process.env['DB_NAME'],
        PORT: process.env['DB_PORT'],
    }
})