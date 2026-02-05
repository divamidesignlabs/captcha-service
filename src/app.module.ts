import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CaptchaModule, CaptchaProvider } from '.';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: config.get<'postgres'>('DB_TYPE', 'postgres'),
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
      }),
    }),
    
    // CAPTCHA Module with dynamic configuration
    CaptchaModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        provider: config.get('CAPTCHA_PROVIDER') as CaptchaProvider,
        secretKey: config.get('CAPTCHA_SECRET_KEY') || '',
        minimumScore: parseFloat(config.get('CAPTCHA_MINIMUM_SCORE') || '0.5'),
      }),
    }),
  
  ],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule {}
