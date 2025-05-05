import { forwardRef, Module } from '@nestjs/common';
import { LoginUsingGoogleService } from './login-using-google.service';
import { LoginUsingGoogleController } from './login-using-google.controller';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports:[
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule)
  ],
  controllers: [LoginUsingGoogleController],
  providers: [LoginUsingGoogleService],
})
export class LoginUsingGoogleModule {}
