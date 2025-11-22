import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import { FoodImageValidationService } from './food-image-validation.service';

@Module({
    imports: [ConfigModule],
    providers: [GeminiCoreService, FoodImageValidationService],
    exports: [FoodImageValidationService],
})
export class FoodImageValidationModule { }
