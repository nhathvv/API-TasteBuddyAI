import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, AuthProvider } from './schemas/user.schema';

export interface CreateUserDto {
  email: string;
  fullName: string;
  avatar?: string;
  provider: AuthProvider;
  providerId: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(createUserDto);
    return user.save();
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
