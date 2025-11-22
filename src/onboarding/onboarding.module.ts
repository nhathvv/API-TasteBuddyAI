import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Language, LanguageSchema } from './schemas/language.schema';
import { Onboarding, OnboardingSchema } from './schemas/onboarding.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Language.name, schema: LanguageSchema },
      { name: Onboarding.name, schema: OnboardingSchema },
    ]),
  ],
})
export class OnboardingModule {}
