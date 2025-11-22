import { Test, TestingModule } from '@nestjs/testing';
import { AllergenSafetyAgent } from '../allergen-safety.agent';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import { CSAAInput, CSAAOutput } from '../allergen-safety.schema';
import { MenuItem } from '../../visual-extraction/visual-extraction.schema';

describe('AllergenSafetyAgent', () => {
  let agent: AllergenSafetyAgent;
  let geminiService: jest.Mocked<GeminiCoreService>;

  beforeEach(async () => {
    // Create mock Gemini service
    const mockGeminiService = {
      getProModel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllergenSafetyAgent,
        {
          provide: GeminiCoreService,
          useValue: mockGeminiService,
        },
      ],
    }).compile();

    agent = module.get<AllergenSafetyAgent>(AllergenSafetyAgent);
    geminiService = module.get(GeminiCoreService);
  });

  it('should be defined', () => {
    expect(agent).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return correct agent configuration', () => {
      const config = agent.getConfig();

      expect(config.name).toBe('AllergenSafetyAgent');
      expect(config.modelType).toBe('pro'); // Uses Pro for complex reasoning
      expect(config.timeout).toBe(20000); // 20 seconds
      expect(config.cacheable).toBe(false); // User profiles change
    });

    it('should have Vietnamese cuisine knowledge in system instructions', () => {
      const config = agent.getConfig();

      expect(config.systemInstruction).toContain('Vietnamese cuisine');
      expect(config.systemInstruction).toContain('Mắm Tôm');
      expect(config.systemInstruction).toContain('Sa Tế');
      expect(config.systemInstruction).toContain('Riêu');
      expect(config.systemInstruction).toContain('NEVER ASSUME SAFETY');
    });
  });

  describe('validate', () => {
    it('should validate correct input', () => {
      const input: CSAAInput = {
        menuItems: [
          { name: 'Phở Bò', price: 50000 },
          { name: 'Bún Riêu', price: 45000 },
        ],
        userAllergens: [{ type: 'shellfish', severity: 'severe' }],
      };

      expect(agent.validate(input)).toBe(true);
    });

    it('should reject empty menuItems', () => {
      const input: CSAAInput = {
        menuItems: [],
        userAllergens: [{ type: 'peanuts', severity: 'moderate' }],
      };

      expect(agent.validate(input)).toBe(false);
    });

    it('should reject missing menuItems', () => {
      const input = {
        userAllergens: [{ type: 'peanuts', severity: 'moderate' }],
      } as CSAAInput;

      expect(agent.validate(input)).toBe(false);
    });

    it('should reject empty userAllergens', () => {
      const input: CSAAInput = {
        menuItems: [{ name: 'Phở Bò', price: 50000 }],
        userAllergens: [],
      };

      expect(agent.validate(input)).toBe(false);
    });

    it('should reject missing userAllergens', () => {
      const input = {
        menuItems: [{ name: 'Phở Bò', price: 50000 }],
      } as CSAAInput;

      expect(agent.validate(input)).toBe(false);
    });

    it('should accept multiple allergens', () => {
      const input: CSAAInput = {
        menuItems: [{ name: 'Phở Bò', price: 50000 }],
        userAllergens: [
          { type: 'shellfish', severity: 'severe' },
          { type: 'peanuts', severity: 'moderate' },
          { type: 'gluten', severity: 'mild' },
        ],
      };

      expect(agent.validate(input)).toBe(true);
    });
  });

  describe('buildAnalysisPrompt', () => {
    it('should build comprehensive analysis prompt', () => {
      const input: CSAAInput = {
        menuItems: [
          { name: 'Phở Bò', price: 50000 },
          { name: 'Bún Riêu', price: 45000, description: 'Crab noodle soup' },
        ],
        userAllergens: [
          { type: 'shellfish', severity: 'severe' },
          { type: 'peanuts', severity: 'moderate' },
        ],
        strictMode: true,
      };

      const prompt = agent['buildAnalysisPrompt'](input);

      // Check allergen profile is included
      expect(prompt).toContain('SHELLFISH');
      expect(prompt).toContain('severe reaction');
      expect(prompt).toContain('PEANUTS');
      expect(prompt).toContain('moderate reaction');

      // Check menu items are included
      expect(prompt).toContain('Phở Bò');
      expect(prompt).toContain('Bún Riêu');
      expect(prompt).toContain('Crab noodle soup');

      // Check mode
      expect(prompt).toContain('STRICT');

      // Check task requirements
      expect(prompt).toContain('Chain-of-Thought');
      expect(prompt).toContain('Vietnamese cuisine knowledge');
    });

    it('should indicate flexible mode when strictMode is false', () => {
      const input: CSAAInput = {
        menuItems: [{ name: 'Phở Bò', price: 50000 }],
        userAllergens: [{ type: 'peanuts', severity: 'mild' }],
        strictMode: false,
      };

      const prompt = agent['buildAnalysisPrompt'](input);

      expect(prompt).toContain('FLEXIBLE');
    });

    it('should default to strict mode if not specified', () => {
      const input: CSAAInput = {
        menuItems: [{ name: 'Phở Bò', price: 50000 }],
        userAllergens: [{ type: 'peanuts', severity: 'mild' }],
      };

      const prompt = agent['buildAnalysisPrompt'](input);

      expect(prompt).toContain('STRICT');
    });

    it('should handle dishes without descriptions', () => {
      const input: CSAAInput = {
        menuItems: [{ name: 'Cơm Gà', price: 35000 }],
        userAllergens: [{ type: 'shellfish', severity: 'severe' }],
      };

      const prompt = agent['buildAnalysisPrompt'](input);

      expect(prompt).toContain('Cơm Gà');
      expect(prompt).not.toContain(' - undefined');
    });
  });

  describe('validateOutput', () => {
    it('should validate correct output', () => {
      const output: CSAAOutput = {
        analysis: [
          {
            dishName: 'Phở Bò',
            riskLevel: 'SAFE',
            identifiedAllergens: [],
            reasoning: 'No shellfish detected in beef noodle soup.',
            confidenceScore: 0.9,
          },
          {
            dishName: 'Bún Riêu',
            riskLevel: 'HIGH_RISK',
            identifiedAllergens: [
              {
                allergen: 'shellfish',
                source: 'Riêu (crab paste)',
                likelihood: 'definite',
                severity: 'severe',
              },
            ],
            reasoning: 'Contains crab paste which is core ingredient.',
            confidenceScore: 0.95,
          },
        ],
        summary: {
          safeItems: 1,
          warningItems: 0,
          unsafeItems: 1,
          overallRisk: 'high',
        },
      };

      expect(agent['validateOutput'](output)).toBe(true);
    });

    it('should reject output without analysis', () => {
      const output = {
        summary: {
          safeItems: 0,
          warningItems: 0,
          unsafeItems: 0,
          overallRisk: 'low',
        },
      } as CSAAOutput;

      expect(agent['validateOutput'](output)).toBe(false);
    });

    it('should reject output without summary', () => {
      const output = {
        analysis: [],
      } as CSAAOutput;

      expect(agent['validateOutput'](output)).toBe(false);
    });

    it('should reject output with empty analysis', () => {
      const output: CSAAOutput = {
        analysis: [],
        summary: {
          safeItems: 0,
          warningItems: 0,
          unsafeItems: 0,
          overallRisk: 'low',
        },
      };

      expect(agent['validateOutput'](output)).toBe(false);
    });

    it('should warn about high UNKNOWN_RISK count', () => {
      const loggerWarnSpy = jest.spyOn(agent['logger'], 'warn');

      const output: CSAAOutput = {
        analysis: [
          {
            dishName: 'Unknown Dish 1',
            riskLevel: 'UNKNOWN_RISK',
            identifiedAllergens: [],
            reasoning: 'Unfamiliar dish',
            confidenceScore: 0.3,
          },
          {
            dishName: 'Unknown Dish 2',
            riskLevel: 'UNKNOWN_RISK',
            identifiedAllergens: [],
            reasoning: 'Unfamiliar dish',
            confidenceScore: 0.3,
          },
        ],
        summary: {
          safeItems: 0,
          warningItems: 0,
          unsafeItems: 2,
          overallRisk: 'medium',
        },
      };

      agent['validateOutput'](output);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('UNKNOWN_RISK'),
      );
    });

    it('should warn about SEVERE_RISK dishes', () => {
      const loggerWarnSpy = jest.spyOn(agent['logger'], 'warn');

      const output: CSAAOutput = {
        analysis: [
          {
            dishName: 'Dangerous Dish',
            riskLevel: 'SEVERE_RISK',
            identifiedAllergens: [
              {
                allergen: 'shellfish',
                source: 'Core ingredient',
                likelihood: 'definite',
                severity: 'life-threatening',
              },
            ],
            reasoning: 'Life-threatening allergen present',
            confidenceScore: 0.95,
          },
        ],
        summary: {
          safeItems: 0,
          warningItems: 0,
          unsafeItems: 1,
          overallRisk: 'critical',
        },
      };

      agent['validateOutput'](output);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SEVERE RISK'),
      );
    });
  });

  describe('handleError', () => {
    it('should transform empty menu error', () => {
      const error = new Error('menuItems cannot be empty');
      const transformed = agent['handleError'](error);

      expect(transformed.message).toContain('CSAA_EMPTY_MENU');
    });

    it('should transform no allergens error', () => {
      const error = new Error('userAllergens cannot be empty');
      const transformed = agent['handleError'](error);

      expect(transformed.message).toContain('CSAA_NO_ALLERGENS');
    });

    it('should transform timeout error', () => {
      const error = new Error('Agent timeout after 20000ms');
      const transformed = agent['handleError'](error);

      expect(transformed.message).toContain('CSAA_TIMEOUT');
      expect(transformed.message).toContain('fewer items');
    });

    it('should wrap generic errors', () => {
      const error = new Error('Unknown error');
      const transformed = agent['handleError'](error);

      expect(transformed.message).toContain('CSAA_ERROR');
      expect(transformed.message).toContain('Unknown error');
    });
  });

  // Vietnamese cuisine-specific test scenarios
  describe('Vietnamese Cuisine Knowledge', () => {
    it('should have knowledge about Mắm Tôm (fermented shrimp paste)', () => {
      const config = agent.getConfig();

      expect(config.systemInstruction).toContain('Mắm Tôm');
      expect(config.systemInstruction).toContain('fermented shrimp paste');
      expect(config.systemInstruction).toContain('Bún Đậu');
      expect(config.systemInstruction).toContain('Bún Riêu');
    });

    it('should have knowledge about Sa Tế (chili oil with shrimp)', () => {
      const config = agent.getConfig();

      expect(config.systemInstruction).toContain('Sa Tế');
      expect(config.systemInstruction).toContain('dried shrimp extract');
    });

    it('should have knowledge about Riêu (crab/shrimp paste)', () => {
      const config = agent.getConfig();

      expect(config.systemInstruction).toContain('Riêu');
      expect(config.systemInstruction).toContain('crab/shrimp paste');
    });

    it('should have knowledge about peanuts in Gỏi (salads)', () => {
      const config = agent.getConfig();

      expect(config.systemInstruction).toContain('Gỏi');
      expect(config.systemInstruction).toContain('peanuts');
    });

    it('should have knowledge about gluten in soy sauce marinades', () => {
      const config = agent.getConfig();

      expect(config.systemInstruction).toContain('soy sauce');
      expect(config.systemInstruction).toContain('Thịt Nướng');
    });

    it('should have knowledge about wheat in Chả (sausage)', () => {
      const config = agent.getConfig();

      expect(config.systemInstruction).toContain('Chả');
      expect(config.systemInstruction).toContain('wheat flour');
      expect(config.systemInstruction).toContain('binder');
    });
  });

  describe('Safety Philosophy', () => {
    it('should emphasize NEVER ASSUME SAFETY principle', () => {
      const config = agent.getConfig();

      expect(config.systemInstruction).toContain('NEVER ASSUME SAFETY');
      expect(config.systemInstruction).toContain('Err on the side of caution');
    });

    it('should require Chain-of-Thought reasoning', () => {
      const config = agent.getConfig();

      expect(config.systemInstruction).toContain('CHAIN-OF-THOUGHT');
      expect(config.systemInstruction).toContain('step-by-step');
    });

    it('should have clear risk level classification rules', () => {
      const config = agent.getConfig();

      expect(config.systemInstruction).toContain('SEVERE_RISK');
      expect(config.systemInstruction).toContain('HIGH_RISK');
      expect(config.systemInstruction).toContain('MEDIUM_RISK');
      expect(config.systemInstruction).toContain('LOW_RISK');
      expect(config.systemInstruction).toContain('SAFE');
      expect(config.systemInstruction).toContain('UNKNOWN_RISK');
    });

    it('should require recommendations for unsafe dishes', () => {
      const config = agent.getConfig();

      expect(config.systemInstruction).toContain('RECOMMENDATIONS');
      expect(config.systemInstruction).toContain('Ask staff');
      expect(config.systemInstruction).toContain('Request modification');
    });
  });

  // Note: Full integration tests with real Gemini API calls
  // should be in a separate e2e test file
});
