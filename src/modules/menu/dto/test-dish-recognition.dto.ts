import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for testing Dish Recognition Agent
 * Identifies dishes from an image
 */
export class TestDishRecognitionDto {
    @ApiProperty({
        description: 'Base64 encoded image data (without data URI prefix)',
        example: 'iVBORw0KGgoAAAANSUhEUgAAAAUA...',
    })
    @IsString()
    imageData: string;

    @ApiProperty({
        description: 'MIME type of the image',
        enum: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
        example: 'image/jpeg',
    })
    @IsString()
    mimeType: string;

    @ApiPropertyOptional({
        description: 'Optional context or hint for recognition',
        example: 'Vietnamese breakfast',
    })
    @IsOptional()
    @IsString()
    context?: string;
}
