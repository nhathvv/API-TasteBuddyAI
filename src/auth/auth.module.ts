import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        ConfigModule,
        MongooseModule.forFeature([
            { name: RefreshToken.name, schema: RefreshTokenSchema },
        ]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET');
                console.log('DEBUG: JWT_SECRET from ConfigService:', secret);

                if (!secret) {
                    console.warn('WARNING: JWT_SECRET is not set in ConfigService. Checking process.env...');
                    console.log('DEBUG: process.env.JWT_SECRET:', process.env.JWT_SECRET);
                }

                return {
                    secret: secret || process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
                    signOptions: {
                        expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
                    } as any,
                };
            },
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule { }
