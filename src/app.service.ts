import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async onModuleInit() {
    await this.cache.set('testKey', 'hello from redis', 120000);
    const value = await this.cache.get('testKey');
    console.log('Test Redis value:', value);
  }
}
