import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DietaryComplianceAgent } from '../dietary-compliance.agent';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import {
  DCAInput,
  DCAOutput,
  validateDCAInput,
  validateDCAOutput,
} from '../dietary-compliance.schema';
import { GenerativeModel } from '@google/generative-ai';

describe('DietaryComplianceAgent', () => {
  let agent: DietaryComplianceAgent;
  let geminiService: GeminiCoreService;
  let mockProModel: jest.Mocked<GenerativeModel>;

  beforeEach(async () => {
    // Mock GenerativeModel
    mockProModel = {
      generateContent: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DietaryComplianceAgent,
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

    agent = module.get<DietaryComplianceAgent>(DietaryComplianceAgent);
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

      expect(config.name).toBe('DietaryComplianceAgent');
      expect(config.modelType).toBe('pro');
      expect(config.timeout).toBe(20000);
      expect(config.cacheable).toBe(false);
      expect(config.systemInstruction).toBeDefined();
      expect(config.systemInstruction).toContain('Dietary Compliance');
    });
  });

  describe('Validation', () => {
    it('should validate correct input', () => {
      const input: DCAInput = {
        menuItems: [
          {
            name: 'Phở Bò',
            description: 'Beef noodle soup',
          },
        ],
        dietaryRestrictions: ['halal'],
      };

      expect(() => validateDCAInput(input)).not.toThrow();
    });

    it('should throw error for empty menuItems', () => {
      const input: DCAInput = {
        menuItems: [],
        dietaryRestrictions: ['vegan'],
      };

      expect(() => validateDCAInput(input)).toThrow('menuItems cannot be empty');
    });

    it('should throw error for non-array menuItems', () => {
      const input = {
        menuItems: 'not an array',
        dietaryRestrictions: ['vegan'],
      } as any;

      expect(() => validateDCAInput(input)).toThrow('menuItems must be an array');
    });

    it('should throw error for empty dietaryRestrictions', () => {
      const input: DCAInput = {
        menuItems: [{ name: 'Phở' }],
        dietaryRestrictions: [],
      };

      expect(() => validateDCAInput(input)).toThrow(
        'dietaryRestrictions cannot be empty',
      );
    });

    it('should throw error for menu item without name', () => {
      const input: DCAInput = {
        menuItems: [{ name: '' }],
        dietaryRestrictions: ['vegan'],
      };

      expect(() => validateDCAInput(input)).toThrow(
        'Each menu item must have a non-empty name',
      );
    });
  });

  describe('Vegan Compliance', () => {
    it('should detect non-compliant dish with fish sauce', async () => {
      const mockOutput: DCAOutput = {
        results: [
          {
            dishName: 'Phở Bò',
            status: 'NON_COMPLIANT',
            confidence: 'high',
            complianceScore: 0.0,
            nonCompliantIngredients: [
              {
                ingredient: 'Beef',
                reason: 'Animal meat not allowed in vegan diet',
                violates: 'vegan',
                confidence: 'high',
              },
              {
                ingredient: 'Fish Sauce (Nước Mắm)',
                reason: 'Made from fermented fish, contains animal products',
                violates: 'vegan',
                confidence: 'high',
              },
            ],
            compliantIngredients: ['Rice noodles', 'Herbs', 'Onions'],
            uncertainIngredients: [],
            reasoning:
              'Phở Bò contains beef (main protein) and fish sauce (standard seasoning), both non-vegan.',
            alternatives: [
              {
                dishName: 'Phở Chay',
                reason: 'Vegetable-based pho with no animal products',
                similarityScore: 0.9,
              },
            ],
          },
        ],
        summary: {
          totalDishes: 1,
          compliantCount: 0,
          nonCompliantCount: 1,
          uncertainCount: 0,
          complianceRate: 0.0,
        },
        recommendations: [
          'Ask for Phở Chay (vegan pho) with confirmed vegetable broth',
          'Verify no fish sauce is used in preparation',
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: DCAInput = {
        menuItems: [
          {
            name: 'Phở Bò',
            description: 'Traditional beef noodle soup',
          },
        ],
        dietaryRestrictions: ['vegan'],
      };

      const result = await agent.execute(input);

      expect(result.results[0].status).toBe('NON_COMPLIANT');
      expect(result.results[0].nonCompliantIngredients.length).toBeGreaterThan(0);
      expect(result.summary.nonCompliantCount).toBe(1);
    });

    it('should identify compliant vegan dish', async () => {
      const mockOutput: DCAOutput = {
        results: [
          {
            dishName: 'Gỏi Cuốn Chay',
            status: 'LIKELY_COMPLIANT',
            confidence: 'medium',
            complianceScore: 0.85,
            nonCompliantIngredients: [],
            compliantIngredients: [
              'Rice paper',
              'Lettuce',
              'Herbs',
              'Tofu',
              'Rice vermicelli',
            ],
            uncertainIngredients: ['Dipping sauce'],
            reasoning:
              'Spring rolls are vegan-friendly with vegetables and tofu. Main concern is dipping sauce which may contain fish sauce.',
            notes: ['Verify dipping sauce does not contain fish sauce'],
          },
        ],
        summary: {
          totalDishes: 1,
          compliantCount: 0,
          nonCompliantCount: 0,
          uncertainCount: 1,
          complianceRate: 0.85,
        },
        recommendations: [
          'Request vegan dipping sauce (soy sauce based, no fish sauce)',
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: DCAInput = {
        menuItems: [{ name: 'Gỏi Cuốn Chay' }],
        dietaryRestrictions: ['vegan'],
      };

      const result = await agent.execute(input);

      expect(result.results[0].complianceScore).toBeGreaterThan(0.7);
      expect(result.results[0].uncertainIngredients.length).toBeGreaterThan(0);
    });
  });

  describe('Halal Compliance', () => {
    it('should detect pork in non-halal dish', async () => {
      const mockOutput: DCAOutput = {
        results: [
          {
            dishName: 'Cơm Tấm Sườn',
            status: 'NON_COMPLIANT',
            confidence: 'high',
            complianceScore: 0.0,
            nonCompliantIngredients: [
              {
                ingredient: 'Pork Ribs (Sườn Heo)',
                reason: 'Pork is forbidden in halal diet',
                violates: 'halal',
                confidence: 'high',
              },
            ],
            compliantIngredients: ['Rice', 'Cucumber', 'Tomato'],
            uncertainIngredients: [],
            reasoning:
              'Cơm Tấm Sườn features grilled pork ribs as the main protein, which is not halal.',
            alternatives: [
              {
                dishName: 'Cơm Gà Nướng',
                reason: 'Similar rice plate with grilled chicken instead',
                similarityScore: 0.9,
              },
              {
                dishName: 'Cơm Bò Nướng',
                reason: 'Rice with grilled beef (ensure halal certified)',
                similarityScore: 0.85,
              },
            ],
          },
        ],
        summary: {
          totalDishes: 1,
          compliantCount: 0,
          nonCompliantCount: 1,
          uncertainCount: 0,
          complianceRate: 0.0,
        },
        recommendations: [
          'Choose chicken or beef options instead of pork',
          'Verify meat is halal certified',
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: DCAInput = {
        menuItems: [{ name: 'Cơm Tấm Sườn' }],
        dietaryRestrictions: ['halal'],
      };

      const result = await agent.execute(input);

      expect(result.results[0].status).toBe('NON_COMPLIANT');
      expect(
        result.results[0].nonCompliantIngredients.some((ing) =>
          ing.ingredient.toLowerCase().includes('pork'),
        ),
      ).toBe(true);
    });
  });

  describe('Gluten-Free Compliance', () => {
    it('should detect gluten in soy sauce marinade', async () => {
      const mockOutput: DCAOutput = {
        results: [
          {
            dishName: 'Thịt Nướng',
            status: 'POSSIBLY_NON_COMPLIANT',
            confidence: 'medium',
            complianceScore: 0.4,
            nonCompliantIngredients: [
              {
                ingredient: 'Soy Sauce (in marinade)',
                reason: 'Traditional soy sauce contains wheat/gluten',
                violates: 'gluten-free',
                confidence: 'medium',
              },
            ],
            compliantIngredients: ['Pork', 'Lemongrass', 'Garlic'],
            uncertainIngredients: ['Marinade ingredients'],
            reasoning:
              'Grilled pork is typically marinated in soy sauce which contains gluten. Need to verify if gluten-free soy sauce is used.',
            notes: [
              'Ask if gluten-free soy sauce (tamari) is available',
              'Request marinade without soy sauce',
            ],
          },
        ],
        summary: {
          totalDishes: 1,
          compliantCount: 0,
          nonCompliantCount: 0,
          uncertainCount: 1,
          complianceRate: 0.4,
        },
        recommendations: [
          'Request dish prepared with gluten-free tamari instead of soy sauce',
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: DCAInput = {
        menuItems: [
          {
            name: 'Thịt Nướng',
            description: 'Grilled marinated pork',
          },
        ],
        dietaryRestrictions: ['gluten-free'],
      };

      const result = await agent.execute(input);

      expect(result.results[0].complianceScore).toBeLessThan(0.7);
      expect(result.results[0].uncertainIngredients.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Restrictions', () => {
    it('should check against multiple dietary restrictions', async () => {
      const mockOutput: DCAOutput = {
        results: [
          {
            dishName: 'Cá Nướng',
            status: 'COMPLIANT',
            confidence: 'high',
            complianceScore: 1.0,
            nonCompliantIngredients: [],
            compliantIngredients: [
              'Fish',
              'Turmeric',
              'Dill',
              'Vegetables',
            ],
            uncertainIngredients: [],
            reasoning:
              'Grilled fish with vegetables is compliant with both pescatarian (fish allowed) and gluten-free (no wheat products). Verify no soy sauce in marinade for complete gluten-free compliance.',
          },
        ],
        summary: {
          totalDishes: 1,
          compliantCount: 1,
          nonCompliantCount: 0,
          uncertainCount: 0,
          complianceRate: 1.0,
        },
        recommendations: [
          'Excellent choice! Fish is healthy and compliant with your restrictions',
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: DCAInput = {
        menuItems: [{ name: 'Cá Nướng' }],
        dietaryRestrictions: ['pescatarian', 'gluten-free'],
      };

      const result = await agent.execute(input);

      expect(result.results[0].status).toBe('COMPLIANT');
      expect(result.results[0].complianceScore).toBe(1.0);
    });

    it('should handle dish violating one of multiple restrictions', async () => {
      const mockOutput: DCAOutput = {
        results: [
          {
            dishName: 'Bánh Mì Thịt',
            status: 'NON_COMPLIANT',
            confidence: 'high',
            complianceScore: 0.0,
            nonCompliantIngredients: [
              {
                ingredient: 'Baguette (wheat bread)',
                reason: 'Contains gluten from wheat flour',
                violates: 'gluten-free',
                confidence: 'high',
              },
              {
                ingredient: 'Pork',
                reason: 'Not allowed in halal diet',
                violates: 'halal',
                confidence: 'high',
              },
            ],
            compliantIngredients: ['Vegetables', 'Herbs'],
            uncertainIngredients: [],
            reasoning:
              'Bánh Mì contains wheat bread (gluten) and pork, violating both gluten-free and halal restrictions.',
            alternatives: [
              {
                dishName: 'Gỏi Gà',
                reason: 'Chicken salad, no bread, no pork',
                similarityScore: 0.6,
              },
            ],
          },
        ],
        summary: {
          totalDishes: 1,
          compliantCount: 0,
          nonCompliantCount: 1,
          uncertainCount: 0,
          complianceRate: 0.0,
        },
        recommendations: [
          'Avoid bread-based dishes for gluten-free diet',
          'Choose rice or noodle-based dishes instead',
        ],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: DCAInput = {
        menuItems: [{ name: 'Bánh Mì Thịt' }],
        dietaryRestrictions: ['gluten-free', 'halal'],
      };

      const result = await agent.execute(input);

      expect(result.results[0].nonCompliantIngredients.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Output Validation', () => {
    it('should validate correct output', () => {
      const output: DCAOutput = {
        results: [
          {
            dishName: 'Test Dish',
            status: 'COMPLIANT',
            confidence: 'high',
            complianceScore: 1.0,
            nonCompliantIngredients: [],
            compliantIngredients: ['Rice', 'Vegetables'],
            uncertainIngredients: [],
            reasoning: 'Dish is fully compliant',
          },
        ],
        summary: {
          totalDishes: 1,
          compliantCount: 1,
          nonCompliantCount: 0,
          uncertainCount: 0,
          complianceRate: 1.0,
        },
        recommendations: ['Great choice!'],
      };

      expect(() => validateDCAOutput(output)).not.toThrow();
    });

    it('should throw error for empty results', () => {
      const output: DCAOutput = {
        results: [],
        summary: {
          totalDishes: 0,
          compliantCount: 0,
          nonCompliantCount: 0,
          uncertainCount: 0,
          complianceRate: 0.0,
        },
        recommendations: [],
      };

      expect(() => validateDCAOutput(output)).toThrow('results cannot be empty');
    });

    it('should throw error for invalid compliance score', () => {
      const output: DCAOutput = {
        results: [
          {
            dishName: 'Test',
            status: 'COMPLIANT',
            confidence: 'high',
            complianceScore: 1.5, // Invalid: > 1.0
            nonCompliantIngredients: [],
            compliantIngredients: [],
            uncertainIngredients: [],
            reasoning: 'Test',
          },
        ],
        summary: {
          totalDishes: 1,
          compliantCount: 1,
          nonCompliantCount: 0,
          uncertainCount: 0,
          complianceRate: 1.0,
        },
        recommendations: [],
      };

      expect(() => validateDCAOutput(output)).toThrow(
        'complianceScore must be between 0.0 and 1.0',
      );
    });

    it('should throw error for mismatched summary counts', () => {
      const output: DCAOutput = {
        results: [
          {
            dishName: 'Test',
            status: 'COMPLIANT',
            confidence: 'high',
            complianceScore: 1.0,
            nonCompliantIngredients: [],
            compliantIngredients: [],
            uncertainIngredients: [],
            reasoning: 'Test',
          },
        ],
        summary: {
          totalDishes: 2, // Mismatch: should be 1
          compliantCount: 1,
          nonCompliantCount: 0,
          uncertainCount: 0,
          complianceRate: 1.0,
        },
        recommendations: [],
      };

      expect(() => validateDCAOutput(output)).toThrow(
        'summary.totalDishes must match results.length',
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Gemini API errors gracefully', async () => {
      mockProModel.generateContent.mockRejectedValue(
        new Error('API Error'),
      );

      const input: DCAInput = {
        menuItems: [{ name: 'Phở' }],
        dietaryRestrictions: ['vegan'],
      };

      await expect(agent.execute(input)).rejects.toThrow();
    });

    it('should handle invalid JSON response', async () => {
      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Invalid JSON'),
        },
      } as any);

      const input: DCAInput = {
        menuItems: [{ name: 'Phở' }],
        dietaryRestrictions: ['vegan'],
      };

      await expect(agent.execute(input)).rejects.toThrow();
    });
  });

  describe('Prompt Building', () => {
    it('should include all dietary restrictions in prompt', async () => {
      const mockOutput: DCAOutput = {
        results: [
          {
            dishName: 'Test',
            status: 'COMPLIANT',
            confidence: 'high',
            complianceScore: 1.0,
            nonCompliantIngredients: [],
            compliantIngredients: [],
            uncertainIngredients: [],
            reasoning: 'Test',
          },
        ],
        summary: {
          totalDishes: 1,
          compliantCount: 1,
          nonCompliantCount: 0,
          uncertainCount: 0,
          complianceRate: 1.0,
        },
        recommendations: ['Test'],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: DCAInput = {
        menuItems: [{ name: 'Test Dish' }],
        dietaryRestrictions: ['vegan', 'gluten-free'],
      };

      await agent.execute(input);

      expect(mockProModel.generateContent).toHaveBeenCalled();
      const callArg = mockProModel.generateContent.mock.calls[0][0];
      const promptText = JSON.stringify(callArg);

      expect(promptText).toContain('vegan');
      expect(promptText).toContain('gluten-free');
    });

    it('should include dish details in prompt', async () => {
      const mockOutput: DCAOutput = {
        results: [
          {
            dishName: 'Phở Bò',
            status: 'COMPLIANT',
            confidence: 'high',
            complianceScore: 1.0,
            nonCompliantIngredients: [],
            compliantIngredients: [],
            uncertainIngredients: [],
            reasoning: 'Test',
          },
        ],
        summary: {
          totalDishes: 1,
          compliantCount: 1,
          nonCompliantCount: 0,
          uncertainCount: 0,
          complianceRate: 1.0,
        },
        recommendations: [],
      };

      mockProModel.generateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockOutput)),
        },
      } as any);

      const input: DCAInput = {
        menuItems: [
          {
            name: 'Phở Bò',
            description: 'Beef noodle soup',
            category: 'Món Nước',
            ingredients: ['beef', 'noodles', 'herbs'],
          },
        ],
        dietaryRestrictions: ['halal'],
      };

      await agent.execute(input);

      const callArg = mockProModel.generateContent.mock.calls[0][0];
      const promptText = JSON.stringify(callArg);

      expect(promptText).toContain('Phở Bò');
      expect(promptText).toContain('Beef noodle soup');
    });
  });
});
