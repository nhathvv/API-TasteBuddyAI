import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Sse,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Observable, interval, map, takeWhile } from 'rxjs';
import { MenuService } from './menu.service';
import { ScanMenuDto } from './dto/scan-menu.dto';
import {
  TestNutritionCoachDto,
  TestAllergenSafetyDto,
  TestDietaryComplianceDto,
  TestVisualExtractionDto,
} from './dto/test-agents.dto';
import { TestDishUnderstandingDto } from './dto/test-dish-understanding.dto';
import { UploadScanDto } from './dto/upload-scan.dto';

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
          description: 'Extraction mode: "quick" (fast, basic info) or "full" (detailed analysis with ingredients, nutrition, allergens)',
          example: 'full',
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

  /**
   * Upload Image for Full Menu Scan (Professional Upload Endpoint)
   *
   * This endpoint provides a comprehensive menu analysis pipeline with:
   * - Visual Extraction (Gemini Flash - fast OCR & menu extraction)
   * - Dish Understanding (Gemini Pro - ingredient analysis)
   * - Allergen Safety Check (Gemini Pro - if allergens provided)
   * - Dietary Compliance Check (Gemini Pro - if restrictions provided)
   *
   * Supports user profile for personalized nutrition recommendations.
   *
   * @param file - Uploaded image file
   * @param dto - Upload scan configuration
   */
  @Post('upload/scan')
  @UseInterceptors(FileInterceptor('image', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      if (validMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Invalid file type. Accepts: ${validMimeTypes.join(', ')}`), false);
      }
    },
  }))
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false, // Allow extra fields (like _id from MongoDB)
    transformOptions: {
      enableImplicitConversion: true,
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload Image for Full Menu Scan (Professional)',
    description: `Upload menu/food image and run comprehensive analysis pipeline.

**Features:**
- 🔍 Gemini Flash Visual Extraction (fast, accurate OCR & menu extraction)
- 🍲 Dish Understanding (Gemini Pro - ingredients, cooking methods, allergens)
- ⚠️ Allergen Safety Check (Gemini Pro - personalized)
- 🥗 Dietary Compliance (Gemini Pro - vegan, halal, keto, etc.)
- 📊 Nutrition Analysis (optional, with user profile)

**Workflow:**
1. Image Validation (Gemini Flash - food/menu photo check)
2. Text Extraction (Gemini Flash - OCR & visual extraction)
3. Dish Understanding (Gemini Pro - AI-powered ingredient analysis)
4. Safety Checks (Gemini Pro - allergen + dietary restrictions)

**Pro Tips:**
- Provide \`allergens\` array for safety analysis
- Include \`nutritionGoals\` for personalized recommendations
- Set \`language: "en"\` for English output

**All powered by Gemini API** - Flash for speed, Pro for reasoning`,
  })
  @ApiBody({ type: UploadScanDto })
  @ApiResponse({
    status: 200,
    description: 'Full scan completed successfully',
    schema: {
      example: {
        extraction: {
          menuSections: [
            {
              sectionName: 'Gemini Flash Extracted Items',
              items: [
                { name: 'Phở Bò', category: 'Menu Items' },
                { name: 'Bún Chả', category: 'Menu Items' },
              ],
            },
          ],
          metadata: {
            totalItems: 2,
            extractionMethod: 'gemini-flash',
            confidenceScore: 0.94,
            processingTime: 850,
          },
        },
        allergenAnalysis: {
          summary: {
            safeItems: 1,
            unsafeItems: 1,
            overallRisk: 'medium',
          },
          analysis: [
            {
              dishName: 'Phở Bò',
              riskLevel: 'SAFE',
              identifiedAllergens: [],
            },
          ],
        },
        dietaryCompliance: null,
        timeline: {
          totalTime: 9500,
          agents: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (validation errors)',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'allergens.0.type must be one of: peanuts, tree-nuts, shellfish...',
          'nutritionGoals.age must not be less than 1',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 413,
    description: 'Image too large (max 10MB)',
  })
  async uploadFullScan(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadScanDto,
  ) {
    // 1. Validate file upload
    if (!file) {
      throw new BadRequestException({
        code: 'ERR_NO_FILE',
        message: 'No image file uploaded',
        hint: 'Make sure the field name is "image" in your form-data',
      });
    }

    // 2. Validate file size (additional check)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException({
        code: 'ERR_FILE_TOO_LARGE',
        message: `Image size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (10MB)`,
        hint: 'Please compress the image or use a smaller file',
      });
    }

    // 3. Convert buffer to base64
    const base64Image = file.buffer.toString('base64');

    // 4. Build ScanMenuDto from UploadScanDto
    const scanDto: ScanMenuDto = {
      imageData: base64Image,
      mimeType: file.mimetype,
      language: dto.language ?? 'vi',
      extractionMode: dto.extractionMode ?? 'quick',
      context: dto.context,
      strictAllergenMode: dto.strictAllergenMode ?? true,
      outputLanguage: dto.language ?? 'en',
      userAllergens: dto.allergens?.map(a => ({
        type: a.type,
        severity: a.severity,
      })) ?? [],
      // Map dietary restrictions
      dietaryRestrictions: dto.dietaryPreferences ?? [],
    };

    // 5. Log request details (for debugging)
    this.menuService['logger'].log(`Upload scan request:
      - File: ${file.originalname} (${(file.size / 1024).toFixed(2)}KB)
      - Mime: ${file.mimetype}
      - Language: ${dto.language ?? 'vi'}
      - Extraction: Gemini Vision (Visual Extraction Agent)
      - Allergens: ${dto.allergens?.length ?? 0} items
      - Dietary: ${dto.dietaryPreferences?.length ?? 0} restrictions
      - Nutrition Profile: ${dto.nutritionGoals ? 'provided' : 'not provided'}
    `);

    // 6. Execute scan
    try {
      return await this.menuService.scanMenu(scanDto);
    } catch (error) {
      // Enhanced error handling
      if (error.message?.includes('GEMINI') || error.message?.includes('EXTRACTION')) {
        throw new BadRequestException({
          code: 'ERR_EXTRACTION_FAILED',
          message: 'Image extraction failed',
          details: error.message,
          hint: 'Please try with a clearer image',
        });
      }

      if (error.message?.includes('ERR_NOT_FOOD_IMAGE')) {
        throw new BadRequestException({
          code: 'ERR_NOT_FOOD_IMAGE',
          message: 'Image is not a valid food/menu photo',
          hint: 'Please upload a clear photo of a menu or food dish',
        });
      }

      // Re-throw original error
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PROGRESSIVE LOADING ENDPOINTS (STREAMING & MICRO-ENDPOINTS)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Upload Scan with Async Processing (Returns JobID immediately)
   *
   * Strategy: Fast initial response → Stream results as agents complete
   * Timeline:
   * - 0s: Upload accepted, jobId returned
   * - 2-5s: Extraction complete (streamed)
   * - 5-8s: Dish understanding complete (streamed)
   * - 8-16s: Safety analysis complete (streamed)
   *
   * @param file - Uploaded image file
   * @param dto - Upload scan configuration
   */
  @Post('upload/scan-async')
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      if (validMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type'), false);
      }
    },
  }))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload Scan (Async with JobID)',
    description: `Upload menu image and receive jobId immediately. Use SSE stream endpoint to receive progressive updates.

**Workflow:**
1. Upload image → Get jobId (< 1s)
2. Listen to /menu/jobs/:jobId/stream → Receive updates in real-time
3. Extract menu items (2-5s)
4. Understand dishes (5-8s)
5. Analyze allergens (8-16s)

**Benefits:**
- ✅ Immediate response (no waiting)
- ✅ Progressive UI updates
- ✅ Real-time feedback`,
  })
  @ApiBody({ type: UploadScanDto })
  @ApiResponse({
    status: 200,
    description: 'Job created successfully',
    schema: {
      example: {
        success: true,
        message: 'Job created successfully',
        jobId: 'job_1234567890_abc123',
        streamUrl: '/menu/jobs/job_1234567890_abc123/stream',
        statusUrl: '/menu/jobs/job_1234567890_abc123',
      },
    },
  })
  async uploadScanAsync(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadScanDto,
  ) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }

    const base64Image = file.buffer.toString('base64');

    // Create scan DTO
    const scanDto: ScanMenuDto = {
      imageData: base64Image,
      mimeType: file.mimetype,
      language: dto.language ?? 'vi',
      extractionMode: dto.extractionMode ?? 'quick',
      context: dto.context,
      strictAllergenMode: dto.strictAllergenMode ?? true,
      outputLanguage: dto.language ?? 'en',
      userAllergens: dto.allergens?.map(a => ({ type: a.type, severity: a.severity })) ?? [],
      dietaryRestrictions: dto.dietaryPreferences ?? [],
    };

    // Create job and start async processing
    const jobId = await this.menuService.scanMenuAsync(scanDto);

    return {
      success: true,
      message: 'Job created successfully',
      jobId,
      streamUrl: `/menu/jobs/${jobId}/stream`,
      statusUrl: `/menu/jobs/${jobId}`,
      hint: 'Use Server-Sent Events (SSE) to listen to /menu/jobs/:jobId/stream for real-time updates',
    };
  }

  /**
   * Stream Job Progress (Server-Sent Events)
   *
   * SSE endpoint that streams progressive updates as agents complete.
   * Frontend can listen to this and update UI in real-time.
   *
   * @param jobId - Job ID from upload-async endpoint
   */
  @Sse('jobs/:jobId/stream')
  @ApiOperation({
    summary: 'Stream Job Progress (SSE)',
    description: `Server-Sent Events (SSE) stream for real-time job updates.

**Event Types:**
- \`stage_update\`: Agent stage completed (extraction, dish_understanding, allergen_analysis, etc.)
- \`job_completed\`: Full analysis complete
- \`job_failed\`: Job failed with error

**Frontend Example:**
\`\`\`javascript
const eventSource = new EventSource('/menu/jobs/{jobId}/stream');

eventSource.addEventListener('stage_update', (e) => {
  const data = JSON.parse(e.data);
  console.log('Stage completed:', data.stage, data.data);
  // Update UI progressively
});

eventSource.addEventListener('job_completed', (e) => {
  const result = JSON.parse(e.data);
  console.log('Full result:', result);
  eventSource.close();
});
\`\`\``,
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream of job updates',
  })
  streamJobProgress(@Param('jobId') jobId: string): Observable<MessageEvent> {
    return this.menuService.streamJobProgress(jobId);
  }

  /**
   * Get Job Status (Polling)
   *
   * Polling endpoint for clients that don't support SSE.
   *
   * @param jobId - Job ID
   */
  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get Job Status (Polling)',
    description: `Get current job status and result.

**Status Values:**
- \`pending\`: Job created, not started
- \`processing\`: Job in progress
- \`completed\`: Job finished successfully
- \`failed\`: Job failed with error

**Usage:**
Poll this endpoint every 2-3 seconds until status is 'completed' or 'failed'.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved',
    schema: {
      example: {
        id: 'job_1234567890_abc123',
        status: 'processing',
        currentStage: 'dish_understanding',
        stages: {
          extraction: {
            status: 'completed',
            duration: 2500,
            data: { totalItems: 5 },
          },
          dish_understanding: {
            status: 'processing',
            startTime: 1234567890123,
          },
        },
        result: null,
        createdAt: 1234567890000,
        updatedAt: 1234567892500,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getJobStatus(@Param('jobId') jobId: string) {
    const job = this.menuService.getJobStatus(jobId);
    if (!job) {
      throw new NotFoundException(`Job not found: ${jobId}`);
    }
    return job;
  }

  // ═══════════════════════════════════════════════════════════════
  // MICRO-ENDPOINTS (Individual Analysis Steps)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Extract Menu Items Only (Fast - 2-5s)
   *
   * Returns only extraction result without any AI analysis.
   * Use this for immediate feedback to users.
   */
  @Post('analysis/extraction')
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Extract Menu Items (Fast)',
    description: `Extract menu items from image (2-5s response time).

**Use Case:** Show users the menu items immediately while running other analysis in background.

**Timeline:** 2-5 seconds`,
  })
  @ApiResponse({
    status: 200,
    description: 'Extraction completed',
  })
  async extractMenuOnly(
    @UploadedFile() file: Express.Multer.File,
    @Body('language') language?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }

    const base64Image = file.buffer.toString('base64');

    return this.menuService.extractMenuOnly({
      imageData: base64Image,
      mimeType: file.mimetype,
      language: language || 'vi',
    });
  }

  /**
   * Analyze Dishes (Ingredients & Cooking Methods)
   *
   * Requires menu items from extraction step.
   */
  @Post('analysis/dishes')
  @ApiOperation({
    summary: 'Analyze Dishes (Ingredients)',
    description: `Analyze dishes to identify ingredients, cooking methods, and allergen signals.

**Timeline:** 2-3 seconds per dish (parallel processing)`,
  })
  @ApiResponse({
    status: 200,
    description: 'Dish analysis completed',
  })
  async analyzeDishes(
    @Body('menuItems') menuItems: any[],
    @Body('language') language?: string,
  ) {
    if (!menuItems || menuItems.length === 0) {
      throw new BadRequestException('menuItems array is required');
    }

    return this.menuService.analyzeDishes(menuItems, language || 'vi');
  }

  /**
   * Analyze Allergen Safety
   *
   * Requires enriched dishes from analyzeDishes step.
   */
  @Post('analysis/allergens')
  @ApiOperation({
    summary: 'Analyze Allergen Safety',
    description: `Check dishes for allergen risks.

**Timeline:** 3-8 seconds`,
  })
  @ApiResponse({
    status: 200,
    description: 'Allergen analysis completed',
  })
  async analyzeAllergens(
    @Body('menuItems') menuItems: any[],
    @Body('enrichedDishes') enrichedDishes: any[],
    @Body('allergens') allergens: any[],
    @Body('language') language?: string,
  ) {
    if (!allergens || allergens.length === 0) {
      throw new BadRequestException('allergens array is required');
    }

    return this.menuService.analyzeAllergens({
      menuItems: menuItems || [],
      enrichedDishes: enrichedDishes || [],
      allergens,
      language: language || 'vi',
    });
  }

  /**
   * Analyze Dietary Compliance
   *
   * Requires enriched dishes from analyzeDishes step.
   */
  @Post('analysis/dietary')
  @ApiOperation({
    summary: 'Analyze Dietary Compliance',
    description: `Check dishes for dietary compliance (vegan, halal, keto, etc.).

**Timeline:** 3-5 seconds`,
  })
  @ApiResponse({
    status: 200,
    description: 'Dietary compliance completed',
  })
  async analyzeDietary(
    @Body('menuItems') menuItems: any[],
    @Body('enrichedDishes') enrichedDishes: any[],
    @Body('dietaryRestrictions') dietaryRestrictions: string[],
    @Body('language') language?: string,
  ) {
    if (!dietaryRestrictions || dietaryRestrictions.length === 0) {
      throw new BadRequestException('dietaryRestrictions array is required');
    }

    return this.menuService.analyzeDietary({
      menuItems: menuItems || [],
      enrichedDishes: enrichedDishes || [],
      dietaryRestrictions,
      language: language || 'vi',
    });
  }
}
