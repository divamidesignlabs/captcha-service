import { Module, DynamicModule, Global } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { CaptchaGuard } from './captcha.guard';
import { CaptchaConfig } from './interfaces/captcha-config.interface';

@Global()
@Module({})
export class CaptchaModule {
  /**
   * Register captcha module with configuration
   * @param config - Captcha configuration
   */
  static register(config: CaptchaConfig): DynamicModule {
    return {
      module: CaptchaModule,
      providers: [
        {
          provide: 'CAPTCHA_CONFIG',
          useValue: config,
        },
        CaptchaService,
        CaptchaGuard,
      ],
      exports: [CaptchaService, CaptchaGuard],
    };
  }

  /**
   * Register captcha module asynchronously with configuration factory
   * Useful when you need to load config from ConfigService or other async sources
   * 
   * @example
   * CaptchaModule.registerAsync({
   *   imports: [ConfigModule],
   *   inject: [ConfigService],
   *   useFactory: (config: ConfigService) => ({
   *     provider: config.get('CAPTCHA_PROVIDER'),
   *     secretKey: config.get('CAPTCHA_SECRET_KEY'),
   *     minimumScore: parseFloat(config.get('CAPTCHA_MINIMUM_SCORE')),
   *   }),
   * })
   */
  static registerAsync(options: {
    imports?: any[];
    inject?: any[];
    useFactory: (...args: any[]) => Promise<CaptchaConfig> | CaptchaConfig;
  }): DynamicModule {
    return {
      module: CaptchaModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'CAPTCHA_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        CaptchaService,
        CaptchaGuard,
      ],
      exports: [CaptchaService, CaptchaGuard],
    };
  }
}

