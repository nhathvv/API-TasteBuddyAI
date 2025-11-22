import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Language } from 'src/onboarding/schemas/language.schema';
import { Onboarding } from 'src/onboarding/schemas/onboarding.schema';
import { User } from 'src/users/schemas/user.schema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Language.name) private languageModel: Model<Language>,
    @InjectModel(Onboarding.name) private onboardingModel: Model<Onboarding>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async seed() {
    try {
      await this.seedLanguages();
      await this.seedUsersWithOnboarding();
      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error('Error seeding database', error);
    }
  }

  private async seedLanguages() {
    const count = await this.languageModel.countDocuments();
    if (count > 0) {
      this.logger.log('Languages already seeded, skipping...');
      return;
    }

    const seedDataPath = path.join(process.cwd(), 'seeding-data.json');
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'));

    await this.languageModel.insertMany(seedData.languages);
    this.logger.log(`Seeded ${seedData.languages.length} languages`);
  }

  private async seedUsersWithOnboarding() {
    const count = await this.userModel.countDocuments();
    if (count > 0) {
      this.logger.log('Users already seeded, skipping...');
      return;
    }

    const seedDataPath = path.join(process.cwd(), 'seeding-data.json');
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'));

    for (const [index, userData] of seedData.users.entries()) {
      const user = await this.userModel.create({
        email: `user${index + 1}@example.com`,
        fullName: `User ${index + 1}`,
        provider: 'local',
        isOnboarded: userData.completed,
      });

      await this.onboardingModel.create({
        userId: user._id,
        ...userData,
      });

      this.logger.log(`Seeded user: ${user.email}`);
    }

    this.logger.log(`Seeded ${seedData.users.length} users with onboarding data`);
  }
}
