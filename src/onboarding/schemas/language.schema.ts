import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true, collection: 'languages' })
export class Language extends Document {
  @ApiProperty({ description: 'Language code', example: 'en' })
  @Prop({ required: true, unique: true })
  code: string;

  @ApiProperty({ description: 'Language name in English', example: 'English' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Native language name', example: 'English' })
  @Prop({ required: true })
  nativeName: string;

  @ApiProperty({ description: 'Language flag emoji', example: '🇺🇸' })
  @Prop({ required: true })
  flag: string;
}

export const LanguageSchema = SchemaFactory.createForClass(Language);
