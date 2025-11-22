import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { Language, LanguageSchema } from 'src/onboarding/schemas/language.schema';
import { Onboarding, OnboardingSchema } from 'src/onboarding/schemas/onboarding.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Language.name, schema: LanguageSchema },
      { name: Onboarding.name, schema: OnboardingSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
