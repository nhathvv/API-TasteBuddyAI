import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { ScanMenuDto } from './dto/scan-menu.dto';
import {
  TestNutritionCoachDto,
  TestAllergenSafetyDto,
  TestDietaryComplianceDto,
  TestVisualExtractionDto,
} from './dto/test-agents.dto';
import { TestDishUnderstandingDto } from './dto/test-dish-understanding.dto';

@ApiTags('Menu & AI Agents')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) { }

  @Post('scan')
  @ApiOperation({
    summary: 'Full Menu Scan Workflow',
    description:
      'Complete menu analysis pipeline: Visual Extraction → Allergen Safety + Dietary Compliance (parallel execution)',
  })
  @ApiResponse({
    status: 200,
    description: 'Menu scan completed successfully',
    schema: {
      example: {
        extraction: {
          restaurantName: 'Phở Hà Nội',
          menuSections: [
            {
              sectionName: 'Món Nước',
              items: [
                {
                  name: 'Phở Bò',
                  description: 'Phở bò truyền thống',
                  price: 50000,
                },
              ],
            },
          ],
          metadata: {
            totalItems: 15,
            extractionQuality: 'high',
            confidenceScore: 0.95,
          },
        },
        allergenAnalysis: {
          summary: { safeItems: 10, warningItems: 3, unsafeItems: 2 },
        },
        dietaryCompliance: {
          summary: { compliantCount: 8, nonCompliantCount: 5 },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 413, description: 'Image too large (limit: 10MB)' })
  @ApiResponse({ status: 500, description: 'Agent execution failed' })
  async scanMenu(@Body() dto: ScanMenuDto) {
    return this.menuService.scanMenu(dto);
  }

  @Post('test/visual-extraction')
  @ApiOperation({
    summary: 'Test Visual Extraction Agent',
    description:
      'Extract menu items from an image using OCR and Vietnamese cuisine knowledge',
  })
  @ApiBody({
    type: TestVisualExtractionDto,
    examples: {
      'Quick Mode': {
        value: {
          imageData: 'base64_encoded_image_data',
          mimeType: 'image/jpeg',
          language: 'vi',
          extractionMode: 'quick',
        },
      },
      'Full Mode': {
        value: {
          imageData: 'base64_encoded_image_data',
          mimeType: 'image/png',
          language: 'vi',
          extractionMode: 'full',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Menu extracted successfully',
    schema: {
      example: {
        agent: 'VisualExtractionAgent',
        result: {
          restaurantName: 'Quán Cơm Tấm',
          menuSections: [
            {
              sectionName: 'Cơm Tấm',
              items: [
                { name: 'Cơm Tấm Sườn Bì', price: 45000 },
                { name: 'Cơm Tấm Sườn Chả', price: 50000 },
              ],
            },
          ],
          metadata: {
            totalItems: 20,
            extractionQuality: 'high',
            confidenceScore: 0.92,
          },
        },
      },
    },
  })
  async testVisualExtraction(@Body() dto: TestVisualExtractionDto) {
    return this.menuService.testVisualExtraction(dto);
  }

  @Post('test/allergen-safety')
  @ApiOperation({
    summary: 'Test Allergen Safety Agent',
    description:
      'Analyze Vietnamese dishes for allergen risks with hidden ingredient detection (fish sauce, shrimp paste, etc.)',
  })
  @ApiBody({
    type: TestAllergenSafetyDto,
    examples: {
      'Shellfish Allergy': {
        value: {
          menuItems: [
            {
              name: 'Bún Đậu Mắm Tôm',
              description: 'Bún đậu với mắm tôm',
              price: 45000,
            },
            {
              name: 'Phở Bò',
              description: 'Phở bò truyền thống',
              price: 50000,
            },
          ],
          userAllergens: [
            {
              type: 'shellfish',
              severity: 'life-threatening',
            },
          ],
          strictMode: true,
          language: 'en',
        },
      },
      'Multiple Allergies': {
        value: {
          menuItems: [
            { name: 'Gỏi Cuốn', price: 35000 },
            { name: 'Bánh Xèo', price: 40000 },
          ],
          userAllergens: [
            { type: 'shellfish', severity: 'severe' },
            { type: 'peanuts', severity: 'moderate' },
            { type: 'eggs', severity: 'mild' },
          ],
          strictMode: true,
          language: 'en',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Allergen analysis completed',
    schema: {
      example: {
        agent: 'AllergenSafetyAgent',
        result: {
          analysis: [
            {
              dishName: 'Bún Đậu Mắm Tôm',
              riskLevel: 'SEVERE_RISK',
              identifiedAllergens: [
                {
                  allergen: 'shellfish',
                  source: 'Mắm Tôm (shrimp paste)',
                  likelihood: 'definite',
                  severity: 'life-threatening',
                },
              ],
              reasoning:
                'Contains concentrated shrimp paste which is extremely dangerous',
              confidenceScore: 1.0,
            },
          ],
          summary: { safeItems: 1, unsafeItems: 1, overallRisk: 'high' },
        },
      },
    },
  })
  async testAllergenSafety(@Body() dto: TestAllergenSafetyDto) {
    return this.menuService.testAllergenSafety(dto);
  }

  @Post('test/dietary-compliance')
  @ApiOperation({
    summary: 'Test Dietary Compliance Agent',
    description:
      'Check if Vietnamese dishes comply with dietary restrictions (vegan, halal, kosher, etc.)',
  })
  @ApiBody({
    type: TestDietaryComplianceDto,
    examples: {
      'Vegan Check': {
        value: {
          menuItems: [
            {
              name: 'Phở Chay',
              description: 'Phở chay với rau củ',
              price: 45000,
            },
            { name: 'Cơm Gà', description: 'Cơm gà Hải Nam', price: 55000 },
          ],
          dietaryRestrictions: ['vegan'],
          context: 'Looking for authentic vegan Vietnamese options',
        },
      },
      'Halal + Gluten-Free': {
        value: {
          menuItems: [
            { name: 'Phở Gà', price: 50000 },
            { name: 'Bún Bò Huế', price: 55000 },
            { name: 'Cơm Tấm Sườn', price: 45000 },
          ],
          dietaryRestrictions: ['halal', 'gluten-free'],
          context: 'Muslim customer with celiac disease',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Dietary compliance check completed',
    schema: {
      example: {
        agent: 'DietaryComplianceAgent',
        result: {
          results: [
            {
              dishName: 'Phở Chay',
              status: 'POSSIBLY_NON_COMPLIANT',
              confidence: 'medium',
              complianceScore: 0.6,
              nonCompliantIngredients: [
                {
                  ingredient: 'Fish sauce (possible)',
                  reason: 'Many chay dishes still use fish sauce',
                  violates: 'vegan',
                },
              ],
              reasoning: 'Verify with restaurant that no fish sauce is used',
              alternatives: [
                { dishName: 'Gỏi Cuốn Chay', similarityScore: 0.7 },
              ],
            },
          ],
          summary: { compliantCount: 0, nonCompliantCount: 1 },
          recommendations: [
            'Always verify chay dishes dont contain fish sauce',
          ],
        },
      },
    },
  })
  async testDietaryCompliance(@Body() dto: TestDietaryComplianceDto) {
    return this.menuService.testDietaryCompliance(dto);
  }

  @Post('test/nutrition-coach')
  @ApiOperation({
    summary: 'Test Nutrition Coach Agent',
    description:
      'Get personalized nutrition recommendations and Vietnamese meal plans based on user profile and goals',
  })
  @ApiBody({
    type: TestNutritionCoachDto,
    examples: {
      'Daily Targets - Weight Loss': {
        value: {
          age: 30,
          gender: 'male',
          weight: 75,
          height: 175,
          activityLevel: 'moderate',
          goal: 'weight-loss',
          healthConditions: ['hypertension'],
          dietaryPreferences: ['mediterranean'],
          requestType: 'daily-targets',
        },
      },
      'Meal Plan - Muscle Gain': {
        value: {
          age: 25,
          gender: 'female',
          weight: 60,
          height: 165,
          activityLevel: 'active',
          goal: 'muscle-gain',
          healthConditions: [],
          dietaryPreferences: ['pescatarian'],
          requestType: 'meal-plan',
          timeframe: 'daily',
        },
      },
      'Dish Analysis': {
        value: {
          age: 35,
          gender: 'male',
          weight: 80,
          height: 178,
          activityLevel: 'light',
          goal: 'maintain',
          requestType: 'dish-analysis',
          menuItems: [
            { name: 'Phở Bò', estimatedCalories: 450 },
            { name: 'Cơm Gà', estimatedCalories: 650 },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Nutrition coaching completed',
    schema: {
      example: {
        agent: 'NutritionCoachAgent',
        result: {
          dailyTargets: {
            calories: 2000,
            protein: 150,
            carbs: 200,
            fats: 67,
            fiber: 30,
            sodium: 1500,
            macroRatio: { protein: 30, carbs: 40, fats: 30 },
          },
          recommendations: [
            {
              category: 'calories',
              priority: 'high',
              text: 'Your daily calorie target is 2000. This represents a 20% deficit for safe weight loss.',
              scientificBasis: 'Based on Mifflin-St Jeor equation',
            },
          ],
          warnings: [
            'Consult your doctor before making major dietary changes',
          ],
          insights: [
            'Vietnamese cuisine can be adapted for weight loss - focus on Phở, Gỏi, grilled meats',
          ],
        },
      },
    },
  })
  async testNutritionCoach(@Body() dto: TestNutritionCoachDto) {
    return this.menuService.testNutritionCoach(dto);
  }

  @Post('test/dish-understanding')
  @ApiOperation({
    summary: 'Test Dish Understanding Agent (DUIA)',
    description:
      'Analyzes a list of dish items to infer ingredients, cooking methods, and allergen signals using Vietnamese culinary knowledge.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dish understanding analysis results',
    schema: {
      example: {
        agent: 'DishUnderstandingAgent',
        result: {
          dishes: [
            {
              dishId: 'dish_001',
              originalName: 'Bún bò Huế',
              canonicalName: 'Bun Bo Hue',
              ingredients: [
                {
                  name: 'mắm ruốc',
                  canonicalName: 'fermented shrimp paste',
                  isPrimary: true,
                  estimatedPresence: 'mandatory',
                },
              ],
              inferredAllergenSignals: ['possible_shellfish_from_mam_ruoc'],
              confidenceScore: 0.95,
            },
          ],
          metadata: {
            totalDishes: 1,
            averageConfidence: 0.95,
          },
        },
      },
    },
  })
  async testDishUnderstanding(@Body() dto: TestDishUnderstandingDto) {
    return this.menuService.testDishUnderstanding(dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // FILE UPLOAD ENDPOINTS (FOR EASY TESTING WITHOUT FRONTEND)
  // ═══════════════════════════════════════════════════════════════

  @Post('upload/visual-extraction')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload Image for Visual Extraction',
    description:
      'Upload menu image directly (no base64 needed). Perfect for testing in Swagger UI or Postman.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Menu image file (JPEG, PNG, WebP, or HEIC)',
        },
        language: {
          type: 'string',
          default: 'vi',
          enum: ['vi', 'en'],
          description: 'Language for extraction',
        },
        extractionMode: {
          type: 'string',
          default: 'quick',
          enum: ['quick', 'full'],
          description: 'Extraction mode',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded and extracted successfully',
    schema: {
      example: {
        agent: 'VisualExtractionAgent',
        result: {
          restaurantName: 'Quán Cơm Tấm',
          menuSections: [
            {
              sectionName: 'Món Chính',
              items: [{ name: 'Cơm Tấm Sườn', price: 45000 }],
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No file uploaded or invalid file type',
  })
  async uploadVisualExtraction(
    @UploadedFile() file: Express.Multer.File,
    @Body('language') language?: string,
    @Body('extractionMode') extractionMode?: 'quick' | 'full',
  ) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Accepts: ${validMimeTypes.join(', ')}`,
      );
    }

    // Convert buffer to base64
    const base64Image = file.buffer.toString('base64');

    // Call Visual Extraction Agent
    return this.menuService.testVisualExtraction({
      imageData: base64Image,
      mimeType: file.mimetype,
      language: language || 'vi',
      extractionMode: extractionMode || 'quick',
    });
  }

  @Post('upload/dish-recognition')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload Image for Dish Recognition',
    description:
      'Identify dishes from an image using Gemini 1.5 Pro (Dish Recognition Agent). Handles single dishes and full table feasts.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Food image file',
        },
        context: {
          type: 'string',
          description: 'Optional context (e.g., "Vietnamese breakfast")',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Dishes identified successfully',
    schema: {
      example: {
        agent: 'DishRecognitionAgent',
        result: {
          dishes: [
            {
              detectedDishName: 'Bún Chả',
              cuisineOrigin: 'Vietnam',
              confidenceScore: 0.95,
              visualCharacteristics: 'Grilled pork patties, vermicelli, herbs',
            },
          ],
        },
      },
    },
  })
  async uploadDishRecognition(
    @UploadedFile() file: Express.Multer.File,
    @Body('context') context?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }

    const base64Image = file.buffer.toString('base64');

    return this.menuService.testDishRecognition({
      imageData: base64Image,
      mimeType: file.mimetype,
      context,
    });
  }

  @Post('upload/scan')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload Image for Full Scan',
    description:
      'Upload menu image and run full analysis pipeline with allergen safety and dietary compliance checks.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Menu image file',
        },
        language: {
          type: 'string',
          default: 'vi',
        },
        userAllergens: {
          type: 'string',
          description: 'JSON string of allergens, e.g. [{"type":"shellfish","severity":"severe"}]',
          example: '[{"type":"shellfish","severity":"severe"}]',
        },
        dietaryRestrictions: {
          type: 'string',
          description: 'JSON string array, e.g. ["vegan","gluten-free"]',
          example: '["vegan"]',
        },
        strictAllergenMode: {
          type: 'boolean',
          default: true,
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Full scan completed successfully',
  })
  async uploadFullScan(
    @UploadedFile() file: Express.Multer.File,
    @Body('language') language?: string,
    @Body('userAllergens') userAllergensStr?: string,
    @Body('dietaryRestrictions') dietaryRestrictionsStr?: string,
    @Body('strictAllergenMode') strictAllergenMode?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }

    // Convert buffer to base64
    const base64Image = file.buffer.toString('base64');

    // Parse JSON strings
    let userAllergens = [];
    let dietaryRestrictions = [];

    try {
      if (userAllergensStr) {
        userAllergens = JSON.parse(userAllergensStr);
      }
    } catch (e) {
      throw new BadRequestException('Invalid userAllergens JSON format');
    }

    try {
      if (dietaryRestrictionsStr) {
        dietaryRestrictions = JSON.parse(dietaryRestrictionsStr);
      }
    } catch (e) {
      throw new BadRequestException('Invalid dietaryRestrictions JSON format');
    }

    // Call full scan
    return this.menuService.scanMenu({
      imageData: base64Image,
      mimeType: file.mimetype,
      language: language || 'vi',
      extractionMode: 'quick',
      userAllergens,
      dietaryRestrictions,
      strictAllergenMode: strictAllergenMode === 'true' || strictAllergenMode === undefined,
    });
  }
}
