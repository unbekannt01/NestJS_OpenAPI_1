import { Module } from '@nestjs/common';
import { ConfigService } from 'src/common/services/config.service';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
