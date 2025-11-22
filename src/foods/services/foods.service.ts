import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant } from '../schemas/restaurant.schema';
import { Food } from '../schemas/food.schema';
import { GooglePlacesService } from './google-places.service';
import { MatchingScoreService } from './matching-score.service';
import {
  SearchFoodsDto,
  SortBy,
} from '../dto/search-foods.dto';
import {
  FoodSearchResultDto,
  FoodSearchResultItem,
} from '../dto/food-search-result.dto';
import { Onboarding } from '../../onboarding/schemas/onboarding.schema';

@Injectable()
export class FoodsService {
  private readonly logger = new Logger(FoodsService.name);

  constructor(
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<Restaurant>,
    @InjectModel(Food.name)
    private foodModel: Model<Food>,
    @InjectModel(Onboarding.name)
    private onboardingModel: Model<Onboarding>,
    private googlePlacesService: GooglePlacesService,
    private matchingScoreService: MatchingScoreService,
  ) {}

  async searchFoods(
    searchDto: SearchFoodsDto,
    userId: string,
  ): Promise<FoodSearchResultDto> {
    this.logger.log(`Searching foods for user ${userId}`);

    // Get user's onboarding profile if useProfilePreferences is true
    let userProfile: Onboarding | null = null;
    if (searchDto.useProfilePreferences !== false) {
      userProfile = await this.onboardingModel.findOne({
        userId,
        completed: true,
      });

      if (!userProfile) {
        throw new NotFoundException(
          'User onboarding profile not found. Please complete onboarding first.',
        );
      }
    }

    // Merge dietary preferences
    const dietaryPreferences = searchDto.useProfilePreferences
      ? [...(userProfile?.dietaryPreferences || []), ...(searchDto.dietaryPreferences || [])]
      : searchDto.dietaryPreferences || [];

    // Find nearby restaurants using geospatial query
    const restaurants = await this.findNearbyRestaurants(
      searchDto.location.latitude,
      searchDto.location.longitude,
      searchDto.radius,
      searchDto.cuisineTypes,
      searchDto.minRating,
    );

    if (restaurants.length === 0) {
      return {
        results: [],
        total: 0,
        page: searchDto.page || 1,
        limit: searchDto.limit || 20,
        totalPages: 0,
        hasMore: false,
      };
    }

    // Get restaurant IDs
    const restaurantIds = restaurants.map((r) => r._id);

    // Build food query
    const foodQuery: any = {
      restaurantId: { $in: restaurantIds },
      isAvailable: true,
    };

    // Filter by meal time
    if (searchDto.mealTime) {
      foodQuery.mealTimes = searchDto.mealTime;
    }

    // Filter by dietary preferences
    if (dietaryPreferences.length > 0) {
      foodQuery.dietaryPreferences = { $all: dietaryPreferences };
    }

    // Filter out foods with user's allergens
    if (userProfile?.allergens && userProfile.allergens.length > 0) {
      const severeAllergens = userProfile.allergens
        .filter((a) => a.severity === 'severe')
        .map((a) => a.type);

      if (severeAllergens.length > 0) {
        foodQuery.allergens = { $nin: severeAllergens };
      }
    }

    // Filter by budget (allow some flexibility, e.g., 20% over budget)
    if (searchDto.budget) {
      foodQuery.price = { $lte: searchDto.budget * 1.2 };
    }

    // Fetch matching foods
    const foods = await this.foodModel
      .find(foodQuery)
      .populate('restaurantId')
      .exec();

    this.logger.log(`Found ${foods.length} matching foods`);

    // Calculate matching scores for each food
    const results: FoodSearchResultItem[] = [];

    for (const food of foods) {
      const restaurant = food.restaurantId as any;

      // Calculate distance
      const distance = this.googlePlacesService.calculateDistance(
        searchDto.location.latitude,
        searchDto.location.longitude,
        restaurant.location.coordinates[1],
        restaurant.location.coordinates[0],
      );

      // Skip if beyond radius
      if (distance > searchDto.radius) {
        continue;
      }

      // Calculate matching score if user profile exists
      const matching = userProfile
        ? this.matchingScoreService.calculateMatchingScore(
            food,
            {
              nutritionGoals: userProfile.nutritionGoals,
              dailyTargets: userProfile.dailyTargets,
              dietaryPreferences: dietaryPreferences as any,
              allergens: userProfile.allergens,
            },
            searchDto.budget,
          )
        : {
            matchingScore: 50,
            healthGoalScore: 50,
            nutritionScore: 50,
            dietaryScore: 50,
            allergenScore: 100,
            budgetScore: searchDto.budget
              ? this.calculateSimpleBudgetScore(food.price, searchDto.budget)
              : 100,
            reasons: ['Search results based on location and filters'],
          };

      results.push({
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          placeId: restaurant.placeId,
          address: restaurant.address,
          rating: restaurant.rating,
          priceLevel: restaurant.priceLevel,
          photos: restaurant.photos,
          isOpen: restaurant.isOpen,
          cuisineTypes: restaurant.cuisineTypes,
        },
        food: {
          _id: food._id,
          name: food.name,
          description: food.description,
          price: food.price,
          currency: food.currency,
          images: food.images,
          nutritionInfo: food.nutritionInfo,
          rating: food.rating,
          reviewCount: food.reviewCount,
          mealTimes: food.mealTimes,
          dietaryPreferences: food.dietaryPreferences,
          preparationTime: food.preparationTime,
        },
        distance,
        distanceText: this.googlePlacesService.formatDistance(distance),
        estimatedPrice: food.price,
        matching,
      });
    }

    // Sort results
    this.sortResults(results, searchDto.sortBy || SortBy.MATCHING_SCORE);

    // Pagination
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);

    return {
      results: paginatedResults,
      total: results.length,
      page,
      limit,
      totalPages: Math.ceil(results.length / limit),
      hasMore: endIndex < results.length,
    };
  }

  private async findNearbyRestaurants(
    latitude: number,
    longitude: number,
    radius: number,
    cuisineTypes?: string[],
    minRating?: number,
  ): Promise<Restaurant[]> {
    const query: any = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radius,
        },
      },
    };

    if (cuisineTypes && cuisineTypes.length > 0) {
      query.cuisineTypes = { $in: cuisineTypes };
    }

    if (minRating) {
      query.rating = { $gte: minRating };
    }

    return this.restaurantModel.find(query).limit(50).exec();
  }

  private sortResults(results: FoodSearchResultItem[], sortBy: SortBy): void {
    switch (sortBy) {
      case SortBy.MATCHING_SCORE:
        results.sort((a, b) => b.matching.matchingScore - a.matching.matchingScore);
        break;
      case SortBy.DISTANCE:
        results.sort((a, b) => a.distance - b.distance);
        break;
      case SortBy.PRICE_LOW_TO_HIGH:
        results.sort((a, b) => a.estimatedPrice - b.estimatedPrice);
        break;
      case SortBy.PRICE_HIGH_TO_LOW:
        results.sort((a, b) => b.estimatedPrice - a.estimatedPrice);
        break;
      case SortBy.RATING:
        results.sort((a, b) => (b.food.rating || 0) - (a.food.rating || 0));
        break;
    }
  }

  private calculateSimpleBudgetScore(price: number, budget: number): number {
    if (price <= budget) {
      return 100;
    }
    const overRatio = (price - budget) / budget;
    return Math.max(0, 100 - overRatio * 100);
  }

  async syncRestaurantsFromGooglePlaces(
    latitude: number,
    longitude: number,
    radius: number,
  ): Promise<void> {
    this.logger.log('Syncing restaurants from Google Places API');

    const places = await this.googlePlacesService.searchNearbyPlaces({
      latitude,
      longitude,
      radius,
      type: 'restaurant',
    });

    for (const place of places) {
      await this.restaurantModel.findOneAndUpdate(
        { placeId: place.placeId },
        {
          placeId: place.placeId,
          name: place.name,
          location: {
            type: 'Point',
            coordinates: [place.location.lng, place.location.lat],
          },
          address: {
            formattedAddress: place.formattedAddress,
            street: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
          },
          rating: place.rating,
          priceLevel: place.priceLevel,
          photos: place.photos,
          phoneNumber: place.phoneNumber,
          website: place.website,
          openingHours: place.openingHours,
          cuisineTypes: place.types || [],
        },
        { upsert: true, new: true },
      );
    }

    this.logger.log(`Synced ${places.length} restaurants`);
  }
}
