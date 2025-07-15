import { Module } from '@nestjs/common';

// Import all feature modules
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { AdminModule } from '../admin/admin.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { BrandsModule } from '../brands/brand.module';
import { CartModule } from '../cart/cart.module';
import { OrderModule } from '../order/order.module';
import { PaymentModule } from '../payment/payment.module';
import { ReviewModule } from '../review/review.module';
import { PasswordModule } from '../password/password.module';
import { SearchModule } from '../search/search.module';
import { OtpModule } from '../otp/otp.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { LoginUsingGoogleModule } from '../login-using-google/login-using-google.module';
import { EmailVerificationByLinkModule } from '../email-verification-by-link/email-verification-by-link.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    AdminModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    CartModule,
    OrderModule,
    PaymentModule,
    ReviewModule,
    PasswordModule,
    SearchModule,
    OtpModule,
    FileUploadModule,
    LoginUsingGoogleModule,
    EmailVerificationByLinkModule,
    GatewayModule,
  ],
})
export class FeaturesModule {}
