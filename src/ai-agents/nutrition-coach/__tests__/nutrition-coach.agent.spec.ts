import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NutritionCoachAgent } from '../nutrition-coach.agent';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import {
  NCAInput,
  NCAOutput,
  validateNCAInput,
  validateNCAOutput,
} from '../nutrition-coach.schema';
import { GenerativeModel } from '@google/generative-ai';

describe('NutritionCoachAgent', () => {
  let agent: NutritionCoachAgent;
  let geminiService: GeminiCoreService;
  let mockProModel: jest.Mocked<GenerativeModel>;

  beforeEach(async () => {
    // Mock GenerativeModel
    mockProModel = {
      generateContent: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NutritionCoachAgent,
        {
          provide: GeminiCoreService,
          useValue: {
            getProModel: jest.fn().mockReturnValue(mockProModel),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    agent = module.get<NutritionCoachAgent>(NutritionCoachAgent);
    geminiService = module.get<GeminiCoreService>(GeminiCoreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Agent Configuration', () => {
    it('should be defined', () => {
      expect(agent).toBeDefined();
    });

    it('should have correct configuration', () => {
      const config = agent.getConfig();

      expect(config.name).toBe('NutritionCoachAgent');
      expect(config.modelType).toBe('pro');
      expect(config.timeout).toBe(25000);
      expect(config.cacheable).toBe(false);
      expect(config.systemInstruction).toBeDefined();
      expect(config.systemInstruction).toContain('Nutrition Coach');
    });
  });

  describe('Validation', () => {
    it('should validate correct input for daily-targets request', () => {
      const input: NCAInput = {
        userProfile: {
          age: 30,
          gender: 'male',
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'lose-weight',
        },
        requestType: 'daily-targets',
      };

      expect(() => validateNCAInput(input)).not.toThrow();
    });

    it('should validate correct input for meal-plan request', () => {
      const input: NCAInput = {
        userProfile: {
          age: 25,
          gender: 'female',
          weight: 60,
          height: 165,
          activityLevel: 'light',
          goal: 'maintain',
          healthConditions: ['diabetes'],
          dietaryPreferences: ['vegetarian'],
        },
        requestType: 'meal-plan',
        timeframe: 'daily',
      };

      expect(() => validateNCAInput(input)).not.toThrow();
    });

    it('should throw error for missing userProfile', () => {
      const input = {
        requestType: 'daily-targets',
      } as any;

      expect(() => validateNCAInput(input)).toThrow('userProfile is required');
    });

    it('should throw error for invalid age', () => {
      const input: NCAInput = {
        userProfile: {
          age: -5,
          gender: 'male',
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'maintain',
        },
        requestType: 'daily-targets',
      };

      expect(() => validateNCAInput(input)).toThrow(
        'Age must be between 1 and 120 years',
      );
    });

    it('should throw error for invalid weight', () => {
      const input: NCAInput = {
        userProfile: {
          age: 30,
          gender: 'male',
          weight: 350,
          height: 175,
          activityLevel: 'moderate',
          goal: 'maintain',
        },
        requestType: 'daily-targets',
      };

      expect(() => validateNCAInput(input)).toThrow(
        'Weight must be between 1 and 300 kg',
      );
    });

    it('should throw error for invalid height', () => {
      const input: NCAInput = {
        userProfile: {
          age: 30,
          gender: 'male',
          weight: 70,
          height: 0,
          activityLevel: 'moderate',
          goal: 'maintain',
        },
        requestType: 'daily-targets',
      };

      expect(() => validateNCAInput(input)).toThrow(
        'Height must be between 1 and 250 cm',
      );
    });

    it('should throw error for missing requestType', () => {
      const input = {
        userProfile: {
          age: 30,
          gender: 'male',
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'maintain',
        },
      } as any;

      expect(() => validateNCAInput(input)).toThrow('requestType is required');
    });
  });

  describe('Daily Targets Calculation', () => {
    it('should calculate daily targets for male weight loss', async () => {
      const mockOutput: NCAOutput = {
        dailyTargets: {
          calories: 2000,
          protein: 175,
          carbs: 200,
          fats: 56,
          fiber: 30,
          sodium: 2300,
          sugar: 30,
          macroRatio: {
            protein: 35,
            carbs: 40,
            fats: 25,
          },
        },
        recommendations: [
          {
            category: 'calories',
            priority: 'high',
            text: 'Aim for 2000 calories daily for safe weight loss.',
          },
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: NCAInput = {
        userProfile: {
          age: 30,
          gender: 'male',
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'lose-weight',
        },
        requestType: 'daily-targets',
      };

      const result = await agent.execute(input);

      expect(result.dailyTargets).toBeDefined();
      expect(result.dailyTargets.calories).toBeGreaterThan(0);
      expect(result.dailyTargets.protein).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate daily targets for female muscle gain', async () => {
      const mockOutput: NCAOutput = {
        dailyTargets: {
          calories: 2500,
          protein: 188,
          carbs: 313,
          fats: 56,
          fiber: 25,
          sodium: 2300,
          sugar: 63,
          macroRatio: {
            protein: 30,
            carbs: 50,
            fats: 20,
          },
        },
        recommendations: [
          {
            category: 'macros',
            priority: 'high',
            text: 'Consume 188g protein daily for muscle growth.',
          },
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: NCAInput = {
        userProfile: {
          age: 25,
          gender: 'female',
          weight: 60,
          height: 165,
          activityLevel: 'active',
          goal: 'gain-muscle',
        },
        requestType: 'daily-targets',
      };

      const result = await agent.execute(input);

      expect(result.dailyTargets.calories).toBeGreaterThan(0);
      expect(result.dailyTargets.protein).toBeGreaterThan(0);
      expect(result.dailyTargets.macroRatio.protein).toBe(30);
    });

    it('should adjust sodium for hypertension', async () => {
      const mockOutput: NCAOutput = {
        dailyTargets: {
          calories: 2200,
          protein: 138,
          carbs: 275,
          fats: 61,
          fiber: 30,
          sodium: 1500, // DASH diet limit
          sugar: 55,
          macroRatio: {
            protein: 25,
            carbs: 50,
            fats: 25,
          },
        },
        recommendations: [
          {
            category: 'micronutrients',
            priority: 'high',
            text: 'Limit sodium to 1500mg due to hypertension.',
          },
        ],
        warnings: [
          'You have hypertension. Follow DASH diet recommendations.',
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: NCAInput = {
        userProfile: {
          age: 50,
          gender: 'male',
          weight: 80,
          height: 170,
          activityLevel: 'light',
          goal: 'maintain',
          healthConditions: ['hypertension'],
        },
        requestType: 'daily-targets',
      };

      const result = await agent.execute(input);

      expect(result.dailyTargets.sodium).toBe(1500);
      expect(result.warnings).toBeDefined();
    });

    it('should adjust sugar for diabetes', async () => {
      const mockOutput: NCAOutput = {
        dailyTargets: {
          calories: 1800,
          protein: 90,
          carbs: 203,
          fats: 50,
          fiber: 30,
          sodium: 2300,
          sugar: 25, // Strict diabetes limit
          macroRatio: {
            protein: 20,
            carbs: 45,
            fats: 25,
          },
        },
        recommendations: [
          {
            category: 'macros',
            priority: 'high',
            text: 'Limit added sugar to 25g due to diabetes.',
          },
        ],
        warnings: ['You have diabetes. Monitor carbohydrate intake carefully.'],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: NCAInput = {
        userProfile: {
          age: 55,
          gender: 'female',
          weight: 70,
          height: 160,
          activityLevel: 'sedentary',
          goal: 'lose-weight',
          healthConditions: ['type-2-diabetes'],
        },
        requestType: 'daily-targets',
      };

      const result = await agent.execute(input);

      expect(result.dailyTargets.sugar).toBe(25);
      expect(result.warnings).toBeDefined();
    });
  });

  describe('Meal Plan Generation', () => {
    it('should generate daily meal plan with Vietnamese dishes', async () => {
      const mockOutput: NCAOutput = {
        dailyTargets: {
          calories: 2000,
          protein: 150,
          carbs: 225,
          fats: 67,
          macroRatio: { protein: 30, carbs: 45, fats: 25 },
        },
        recommendations: [
          {
            category: 'timing',
            priority: 'medium',
            text: 'Distribute meals evenly throughout the day.',
          },
        ],
        mealPlan: {
          meals: [
            {
              mealType: 'breakfast',
              dishes: ['Phở Gà', 'Cà Phê Sữa Đá'],
              nutrition: {
                calories: 450,
                protein: 30,
                carbs: 60,
                fats: 10,
                macroRatio: { protein: 27, carbs: 53, fats: 20 },
              },
              timing: '7:00 AM',
              vietnameseNotes: 'Phở is light and protein-rich for breakfast.',
            },
            {
              mealType: 'lunch',
              dishes: ['Cơm Tấm Sườn Nướng', 'Rau Sống'],
              nutrition: {
                calories: 700,
                protein: 45,
                carbs: 80,
                fats: 20,
                macroRatio: { protein: 26, carbs: 46, fats: 26 },
              },
              timing: '12:00 PM',
            },
            {
              mealType: 'dinner',
              dishes: ['Cá Nướng', 'Rau Xào', 'Cơm Gạo Lứt'],
              nutrition: {
                calories: 650,
                protein: 50,
                carbs: 65,
                fats: 25,
                macroRatio: { protein: 31, carbs: 40, fats: 35 },
              },
              timing: '6:00 PM',
            },
            {
              mealType: 'snack',
              dishes: ['Gỏi Cuốn'],
              nutrition: {
                calories: 200,
                protein: 25,
                carbs: 20,
                fats: 12,
                macroRatio: { protein: 50, carbs: 40, fats: 54 },
              },
            },
          ],
          totalNutrition: {
            calories: 2000,
            protein: 150,
            carbs: 225,
            fats: 67,
            macroRatio: { protein: 30, carbs: 45, fats: 25 },
          },
          adherenceScore: 0.95,
          notes: ['Meal plan matches your weight loss goals.'],
        },
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: NCAInput = {
        userProfile: {
          age: 30,
          gender: 'male',
          weight: 75,
          height: 178,
          activityLevel: 'moderate',
          goal: 'lose-weight',
        },
        requestType: 'meal-plan',
        timeframe: 'daily',
      };

      const result = await agent.execute(input);

      expect(result.mealPlan).toBeDefined();
      expect(result.mealPlan!.meals.length).toBeGreaterThan(0);
      expect(result.mealPlan!.totalNutrition).toBeDefined();
      expect(result.mealPlan!.adherenceScore).toBeGreaterThan(0);
      expect(result.mealPlan!.adherenceScore).toBeLessThanOrEqual(1);
    });

    it('should respect vegetarian dietary preference', async () => {
      const mockOutput: NCAOutput = {
        dailyTargets: {
          calories: 1800,
          protein: 90,
          carbs: 248,
          fats: 50,
          macroRatio: { protein: 20, carbs: 55, fats: 25 },
        },
        recommendations: [
          {
            category: 'macros',
            priority: 'high',
            text: 'Focus on plant-based protein sources.',
          },
        ],
        mealPlan: {
          meals: [
            {
              mealType: 'breakfast',
              dishes: ['Bánh Mì Chay', 'Sữa Đậu Nành'],
              nutrition: {
                calories: 400,
                protein: 15,
                carbs: 60,
                fats: 12,
                macroRatio: { protein: 15, carbs: 60, fats: 27 },
              },
            },
            {
              mealType: 'lunch',
              dishes: ['Phở Chay', 'Đậu Hũ Sốt Cà'],
              nutrition: {
                calories: 650,
                protein: 30,
                carbs: 90,
                fats: 18,
                macroRatio: { protein: 18, carbs: 55, fats: 25 },
              },
            },
            {
              mealType: 'dinner',
              dishes: ['Cơm Chiên Chay', 'Canh Rau'],
              nutrition: {
                calories: 600,
                protein: 35,
                carbs: 80,
                fats: 15,
                macroRatio: { protein: 23, carbs: 53, fats: 23 },
              },
            },
            {
              mealType: 'snack',
              dishes: ['Chè Đậu Xanh'],
              nutrition: {
                calories: 150,
                protein: 10,
                carbs: 18,
                fats: 5,
                macroRatio: { protein: 27, carbs: 48, fats: 30 },
              },
            },
          ],
          totalNutrition: {
            calories: 1800,
            protein: 90,
            carbs: 248,
            fats: 50,
            macroRatio: { protein: 20, carbs: 55, fats: 25 },
          },
          adherenceScore: 0.92,
        },
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: NCAInput = {
        userProfile: {
          age: 28,
          gender: 'female',
          weight: 55,
          height: 162,
          activityLevel: 'light',
          goal: 'maintain',
          dietaryPreferences: ['vegetarian'],
        },
        requestType: 'meal-plan',
        timeframe: 'daily',
      };

      const result = await agent.execute(input);

      expect(result.mealPlan).toBeDefined();
      expect(result.mealPlan!.meals.length).toBeGreaterThan(0);
      // All dishes should be vegetarian (Chay)
      const allDishes = result.mealPlan!.meals.flatMap((m) => m.dishes);
      expect(allDishes.some((dish) => dish.includes('Chay'))).toBe(true);
    });
  });

  describe('Dish Analysis', () => {
    it('should analyze menu items and provide recommendations', async () => {
      const mockOutput: NCAOutput = {
        dailyTargets: {
          calories: 2200,
          protein: 138,
          carbs: 275,
          fats: 61,
          macroRatio: { protein: 25, carbs: 50, fats: 25 },
        },
        recommendations: [
          {
            category: 'calories',
            priority: 'high',
            text: 'Phở Bò is a good choice, moderate calories and high protein.',
          },
          {
            category: 'micronutrients',
            priority: 'medium',
            text: 'Bánh Xèo is high in fat, limit portion size.',
          },
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: NCAInput = {
        userProfile: {
          age: 35,
          gender: 'male',
          weight: 72,
          height: 175,
          activityLevel: 'moderate',
          goal: 'maintain',
        },
        requestType: 'dish-analysis',
        menuItems: [
          {
            name: 'Phở Bò',
            description: 'Beef noodle soup',
            estimatedCalories: 450,
            estimatedProtein: 30,
            estimatedCarbs: 60,
            estimatedFats: 10,
          },
          {
            name: 'Bánh Xèo',
            description: 'Vietnamese crepe',
            estimatedCalories: 650,
            estimatedProtein: 20,
            estimatedCarbs: 50,
            estimatedFats: 40,
          },
        ],
      };

      const result = await agent.execute(input);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(
        result.recommendations.some((r) => r.text.includes('Phở')),
      ).toBeTruthy();
    });
  });

  describe('Output Validation', () => {
    it('should validate correct output', () => {
      const output: NCAOutput = {
        dailyTargets: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fats: 67,
          macroRatio: { protein: 30, carbs: 40, fats: 30 },
        },
        recommendations: [
          {
            category: 'calories',
            priority: 'high',
            text: 'Test recommendation',
          },
        ],
      };

      expect(() => validateNCAOutput(output)).not.toThrow();
    });

    it('should throw error for missing dailyTargets', () => {
      const output = {
        recommendations: [
          {
            category: 'calories',
            priority: 'high',
            text: 'Test',
          },
        ],
      } as any;

      expect(() => validateNCAOutput(output)).toThrow(
        'dailyTargets is required',
      );
    });

    it('should throw error for missing recommendations', () => {
      const output = {
        dailyTargets: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fats: 67,
          macroRatio: { protein: 30, carbs: 40, fats: 30 },
        },
      } as any;

      expect(() => validateNCAOutput(output)).toThrow(
        'At least one recommendation is required',
      );
    });

    it('should throw error for invalid daily targets', () => {
      const output: NCAOutput = {
        dailyTargets: {
          calories: -2000,
          protein: 150,
          carbs: 200,
          fats: 67,
          macroRatio: { protein: 30, carbs: 40, fats: 30 },
        },
        recommendations: [
          {
            category: 'calories',
            priority: 'high',
            text: 'Test',
          },
        ],
      };

      expect(() => validateNCAOutput(output)).toThrow(
        'All daily targets must be positive numbers',
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Gemini API errors gracefully', async () => {
      mockProModel.generateContent.mockRejectedValue(
        new Error('API Error'),
      );

      const input: NCAInput = {
        userProfile: {
          age: 30,
          gender: 'male',
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'maintain',
        },
        requestType: 'daily-targets',
      };

      await expect(agent.execute(input)).rejects.toThrow();
    });

    it('should handle invalid JSON response', async () => {
      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Invalid JSON'),
        },
      } as any);

      const input: NCAInput = {
        userProfile: {
          age: 30,
          gender: 'male',
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'maintain',
        },
        requestType: 'daily-targets',
      };

      await expect(agent.execute(input)).rejects.toThrow();
    });
  });

  describe('Prompt Building', () => {
    it('should build appropriate prompt for daily targets', async () => {
      const mockOutput: NCAOutput = {
        dailyTargets: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fats: 67,
          macroRatio: { protein: 30, carbs: 40, fats: 30 },
        },
        recommendations: [
          {
            category: 'calories',
            priority: 'high',
            text: 'Test',
          },
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: NCAInput = {
        userProfile: {
          age: 30,
          gender: 'male',
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'lose-weight',
        },
        requestType: 'daily-targets',
      };

      await agent.execute(input);

      expect(mockProModel.generateContent).toHaveBeenCalled();
      const callArg = mockProModel.generateContent.mock.calls[0][0];
      const promptText = JSON.stringify(callArg);

      expect(promptText).toContain('Age: 30');
      expect(promptText).toContain('Weight: 70 kg');
      expect(promptText).toContain('Goal: lose-weight');
    });

    it('should include health conditions in prompt', async () => {
      const mockOutput: NCAOutput = {
        dailyTargets: {
          calories: 1800,
          protein: 135,
          carbs: 180,
          fats: 60,
          sodium: 1500,
          sugar: 25,
          macroRatio: { protein: 30, carbs: 40, fats: 30 },
        },
        recommendations: [
          {
            category: 'micronutrients',
            priority: 'high',
            text: 'Monitor sodium',
          },
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: NCAInput = {
        userProfile: {
          age: 50,
          gender: 'male',
          weight: 85,
          height: 170,
          activityLevel: 'light',
          goal: 'lose-weight',
          healthConditions: ['hypertension', 'diabetes'],
        },
        requestType: 'daily-targets',
      };

      await agent.execute(input);

      expect(mockProModel.generateContent).toHaveBeenCalled();
      const callArg = mockProModel.generateContent.mock.calls[0][0];
      const promptText = JSON.stringify(callArg);

      expect(promptText).toContain('hypertension');
      expect(promptText).toContain('diabetes');
    });
  });
});
