import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, AuthProvider } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

export interface CreateUserDto {
  email: string;
  fullName: string;
  avatar?: string;
  provider: AuthProvider;
  providerId: string;
}

import { UpdateProfileDto } from './dto/update-profile.dto';
import { Onboarding } from '../onboarding/schemas/onboarding.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Onboarding.name) private readonly onboardingModel: Model<Onboarding>,
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).populate('onboarding').exec();
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').populate('onboarding').exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).populate('onboarding').exec();
  }

  async create(createUserDto: CreateUserDto & { password?: string }): Promise<User> {
    const { password, ...rest } = createUserDto;

    const user = new this.userModel(rest);

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    return user.save();
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const { onboarding, ...userUpdates } = updateProfileDto;

    // 1. Update User info
    if (Object.keys(userUpdates).length > 0) {
      await this.userModel.findByIdAndUpdate(userId, userUpdates).exec();
    }

    // 2. Update Onboarding info (if provided)
    if (onboarding) {
      // Use dot notation for nested updates if needed, or just merge
      // For simplicity with Mongoose, we can find and update
      // Note: If we want deep merge for nested objects like nutritionGoals, we might need flattening
      // But here we'll assume the DTO structure matches what we want to set/overwrite

      // Better approach: Construct update object with dot notation for nested fields to avoid overwriting entire objects
      // However, since DTO is partial, we can just pass it if we want to replace the sub-documents
      // Or we can use $set

      await this.onboardingModel.findOneAndUpdate(
        { userId },
        { $set: onboarding },
        { new: true, upsert: true } // Create if not exists (though it should exist)
      ).exec();
    }

    // 3. Return updated user with populated onboarding
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateOnboardingStatus(
    userId: string,
    isOnboarded: boolean,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { isOnboarded }, { new: true })
      .exec();
  }
}
