import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum AuthProvider {
  GOOGLE = 'google',
  LOCAL = 'local',
}

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @Prop({ required: true })
  fullName: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://lh3.googleusercontent.com/a/default-user',
    required: false,
  })
  @Prop()
  avatar: string;

  @ApiProperty({
    description: 'Authentication provider',
    enum: AuthProvider,
    example: AuthProvider.GOOGLE,
  })
  @Prop({ type: String, enum: AuthProvider, default: AuthProvider.LOCAL })
  provider: AuthProvider;

  @ApiProperty({ description: 'Provider user ID', required: false })
  @Prop()
  providerId: string;

  @ApiProperty({
    description: 'Whether user has completed onboarding',
    example: false,
  })
  @Prop({ default: false })
  isOnboarded: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
