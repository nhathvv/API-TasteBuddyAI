import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FoodsController } from './foods.controller';
import { FoodsService } from './services/foods.service';
import { GooglePlacesService } from './services/google-places.service';
import { MatchingScoreService } from './services/matching-score.service';
import { Restaurant, RestaurantSchema } from './schemas/restaurant.schema';
import { Food, FoodSchema } from './schemas/food.schema';
import {
  Onboarding,
  OnboardingSchema,
} from '../onboarding/schemas/onboarding.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Food.name, schema: FoodSchema },
      { name: Onboarding.name, schema: OnboardingSchema },
    ]),
  ],
  controllers: [FoodsController],
  providers: [FoodsService, GooglePlacesService, MatchingScoreService],
  exports: [FoodsService, GooglePlacesService, MatchingScoreService],
})
export class FoodsModule {}
