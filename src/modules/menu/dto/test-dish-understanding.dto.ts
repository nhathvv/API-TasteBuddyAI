import {
    IsArray,
    IsOptional,
    IsString,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Dish Item DTO for testing DUIA
 */
export class DishItemDto {
    @ApiProperty({
        description: 'Unique dish identifier',
        example: 'dish_001',
    })
    @IsString()
    dishId: string;

    @ApiProperty({
        description: 'Raw dish name from menu (Vietnamese)',
        example: 'Bún bò Huế',
    })
    @IsString()
    dishName: string;

    @ApiPropertyOptional({
        description: 'Optional dish description',
        example: 'Bún bò Huế truyền thống với mắm ruốc',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Menu section category',
        example: 'Món Nước',
    })
    @IsOptional()
    @IsString()
    sectionName?: string;

    @ApiPropertyOptional({
        description: 'Restaurant region hint',
        example: 'Hue',
        enum: ['Hue', 'Saigon', 'Hanoi', 'Da Nang'],
    })
    @IsOptional()
    @IsString()
    restaurantRegion?: string;

    @ApiPropertyOptional({
        description: 'Menu language code',
        default: 'vi',
        example: 'vi',
    })
    @IsOptional()
    @IsString()
    language?: string;
}

/**
 * Test DUIA DTO
 */
export class TestDishUnderstandingDto {
    @ApiProperty({
        description: 'Array of dish items to analyze',
        type: [DishItemDto],
        example: [
            {
                dishId: 'dish_001',
                dishName: 'Bún bò Huế',
                description: 'Bún bò Huế truyền thống',
                sectionName: 'Món Nước',
                restaurantRegion: 'Hue',
            },
            {
                dishId: 'dish_002',
                dishName: 'Gỏi cuốn',
                description: 'Gỏi cuốn tôm thịt với nước mắm',
                sectionName: 'Khai Vị',
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DishItemDto)
    @ArrayMinSize(1)
    dishes: DishItemDto[];

    @ApiPropertyOptional({
        description: 'Additional context for analysis',
        example: 'Traditional Vietnamese restaurant in Hue',
    })
    @IsOptional()
    @IsString()
    context?: string;
}
