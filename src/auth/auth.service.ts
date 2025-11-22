import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { User, AuthProvider } from '../users/schemas/user.schema';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken } from './schemas/refresh-token.schema';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshToken>,
    ) { }

    async register(registerDto: RegisterDto) {
        // Check if user exists
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new BadRequestException('User already exists');
        }

        // Create user (password hashing is handled in UsersService)
        const user = await this.usersService.create({
            ...registerDto,
            provider: AuthProvider.LOCAL,
            providerId: '',
        });

        // Generate tokens
        return this.generateTokens(user);
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.generateTokens(user);
    }

    async validateUser(email: string, pass: string): Promise<User | null> {
        const user = await this.usersService.findByEmailWithPassword(email);
        if (user && user.password) {
            const isMatch = await bcrypt.compare(pass, user.password);
            if (isMatch) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password, ...result } = user.toObject ? user.toObject() : user;
                return result as User;
            }
        }
        return null;
    }

    private async generateTokens(user: User) {
        const payload = {
            sub: user._id,
            email: user.email,
            info: {
                _id: user._id,
                fullName: user.fullName,
                avatar: user.avatar,
                isOnboarded: user.isOnboarded,
            },
            onboarding: (user as any).onboarding,
            metadata: {
                provider: user.provider,
                creationDate: (user as any).createdAt,
            },
        };
        const accessToken = this.jwtService.sign(payload);

        // Generate refresh token
        const refreshToken = await this.createRefreshToken(user._id as any);

        return {
            accessToken,
            refreshToken: refreshToken.token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                avatar: user.avatar,
                onboarding: (user as any).onboarding,
            },
        };
    }

    async createRefreshToken(userId: string): Promise<RefreshToken> {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const refreshToken = new this.refreshTokenModel({
            token,
            userId,
            expiresAt,
        });

        return refreshToken.save();
    }

    async refreshTokens(token: string) {
        const refreshToken = await this.refreshTokenModel.findOne({
            token,
            isRevoked: false,
            expiresAt: { $gt: new Date() },
        });

        if (!refreshToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Rotate token
        refreshToken.isRevoked = true;
        await refreshToken.save();

        const user = await this.usersService.findById(refreshToken.userId.toString());
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return this.generateTokens(user);
    }

    async logout(userId: string) {
        await this.refreshTokenModel.updateMany(
            { userId, isRevoked: false },
            { isRevoked: true },
        );
        return { message: 'Logged out successfully' };
    }
}
