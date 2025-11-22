import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Language } from 'src/onboarding/schemas/language.schema';
import { Onboarding } from 'src/onboarding/schemas/onboarding.schema';
import { User, AuthProvider } from 'src/users/schemas/user.schema';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Language.name) private languageModel: Model<Language>,
    @InjectModel(Onboarding.name) private onboardingModel: Model<Onboarding>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) { }

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
    // 1. Ensure Admin User Exists
    const adminEmail = 'admin@tastebuddy.ai';
    const existingAdmin = await this.userModel.findOne({ email: adminEmail });

    if (!existingAdmin) {
      // Hash default password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password123!', salt);

      const adminUser = await this.userModel.create({
        email: adminEmail,
        fullName: 'Admin User',
        provider: AuthProvider.LOCAL,
        isOnboarded: true,
        password: hashedPassword,
      });

      await this.onboardingModel.create({
        userId: adminUser._id,
        language: 'en',
        dietaryPreferences: [],
        allergens: [],
        nutritionGoals: {
          gender: 'male',
          age: 30,
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'maintain',
          healthConditions: [],
        },
        dailyTargets: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fats: 65,
        },
        smartFeatures: {
          cameraAccess: true,
          locationAccess: true,
          notifications: true,
        },
        completed: true,
      });
      this.logger.log(`Seeded ADMIN user: ${adminEmail} / Password123!`);
    } else {
      this.logger.log('Admin user already exists, skipping...');
    }

    // 2. Bulk Seed Users (only if empty)
    const count = await this.userModel.countDocuments();
    // If we just created admin, count is 1. If we didn't, count is >= 1.
    // We want to seed bulk users if ONLY admin exists (count == 1) or DB was empty (count == 0, but admin creation makes it 1)
    // Actually, simpler: if count > 1, assume bulk seeded.

    if (count > 1) {
      this.logger.log('Bulk users already seeded, skipping...');
      return;
    }

    const seedDataPath = path.join(process.cwd(), 'seeding-data.json');
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'));

    // Re-hash for bulk users (or reuse if we created admin, but safer to generate new salt/hash or just reuse)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);

    for (const [index, userData] of seedData.users.entries()) {
      const user = await this.userModel.create({
        email: `user${index + 1}@example.com`,
        fullName: `User ${index + 1}`,
        provider: AuthProvider.LOCAL,
        isOnboarded: userData.completed,
        password: hashedPassword,
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
