import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FoodsService } from './services/foods.service';
import { SearchFoodsDto } from './dto/search-foods.dto';
import { FoodSearchResultDto } from './dto/food-search-result.dto';

@ApiTags('Foods')
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Post('search')
  @ApiOperation({
    summary: 'Search for foods based on location and preferences',
    description: `
Search for foods/restaurants based on:
- Location (GPS or custom via Google Places)
- Search radius
- Budget per person
- Meal time (breakfast, lunch, dinner, snack)
- Dietary preferences
- User health goals and nutrition targets

Returns a list of foods sorted by matching score, distance, price, or rating.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
    type: FoodSearchResultDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User onboarding profile not found',
  })
  async searchFoods(
    @Body() searchDto: SearchFoodsDto,
    @Request() req: any,
  ): Promise<FoodSearchResultDto> {
    const userId = req.user?.userId || '692115d9bbfee2b84ecf8695';
    return this.foodsService.searchFoods(searchDto, userId);
  }

  @Post('sync-restaurants')
  @ApiOperation({
    summary: 'Sync restaurants from Google Places API (Admin only)',
    description: 'Fetches restaurants from Google Places API and stores them in the database. This should be called periodically to update restaurant data.',
  })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Restaurants synced successfully',
  })
  async syncRestaurants(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number,
  ): Promise<{ message: string }> {
    await this.foodsService.syncRestaurantsFromGooglePlaces(
      Number(latitude),
      Number(longitude),
      Number(radius),
    );

    return {
      message: 'Restaurants synced successfully',
    };
  }
}
