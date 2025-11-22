import { Test, TestingModule } from '@nestjs/testing';
import { VisualExtractionAgent } from '../visual-extraction.agent';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import { VEAInput, VEAOutput } from '../visual-extraction.schema';

describe('VisualExtractionAgent', () => {
  let agent: VisualExtractionAgent;
  let geminiService: jest.Mocked<GeminiCoreService>;

  beforeEach(async () => {
    // Create mock Gemini service
    const mockGeminiService = {
      sanitizeBase64: jest.fn((data) => data),
      isValidImageMimeType: jest.fn((type) => type === 'image/jpeg'),
      getFlashModel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisualExtractionAgent,
        {
          provide: GeminiCoreService,
          useValue: mockGeminiService,
        },
      ],
    }).compile();

    agent = module.get<VisualExtractionAgent>(VisualExtractionAgent);
    geminiService = module.get(GeminiCoreService);
  });

  it('should be defined', () => {
    expect(agent).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return correct agent configuration', () => {
      const config = agent.getConfig();

      expect(config.name).toBe('VisualExtractionAgent');
      expect(config.modelType).toBe('flash'); // Uses Flash for speed
      expect(config.timeout).toBe(15000); // 15 seconds
      expect(config.cacheable).toBe(false); // Images change, don't cache
    });
  });

  describe('validate', () => {
    it('should validate correct input', () => {
      const input: VEAInput = {
        imageData: 'base64EncodedString...',
        mimeType: 'image/jpeg',
        language: 'vi',
      };

      expect(agent.validate(input)).toBe(true);
    });

    it('should reject missing imageData', () => {
      const input = {
        mimeType: 'image/jpeg',
      } as VEAInput;

      expect(agent.validate(input)).toBe(false);
    });

    it('should reject missing mimeType', () => {
      const input = {
        imageData: 'base64...',
      } as VEAInput;

      expect(agent.validate(input)).toBe(false);
    });

    it('should reject invalid mimeType', () => {
      const input: VEAInput = {
        imageData: 'base64...',
        mimeType: 'text/plain',
      };

      expect(agent.validate(input)).toBe(false);
    });

    it('should accept all valid image MIME types', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

      validTypes.forEach((mimeType) => {
        const input: VEAInput = {
          imageData: 'base64...',
          mimeType,
        };

        expect(agent.validate(input)).toBe(true);
      });
    });
  });

  describe('validateOutput', () => {
    it('should validate correct output', () => {
      const output: VEAOutput = {
        menuSections: [
          {
            sectionName: 'Món Nước',
            items: [
              {
                name: 'Phở Bò',
                price: 50000,
              },
            ],
          },
        ],
        metadata: {
          totalItems: 1,
          extractionQuality: 'high',
          confidenceScore: 0.95,
          processingTime: 3000,
        },
      };

      expect(agent['validateOutput'](output)).toBe(true);
    });

    it('should accept empty menu (no items)', () => {
      const output: VEAOutput = {
        menuSections: [],
        metadata: {
          totalItems: 0,
          extractionQuality: 'low',
          confidenceScore: 0.3,
          processingTime: 2000,
        },
      };

      expect(agent['validateOutput'](output)).toBe(true);
    });

    it('should warn but accept low quality extraction', () => {
      const output: VEAOutput = {
        menuSections: [
          {
            sectionName: 'Test',
            items: [{ name: 'Test', price: 1000 }],
          },
        ],
        metadata: {
          totalItems: 1,
          extractionQuality: 'low',
          confidenceScore: 0.5,
          processingTime: 1000,
        },
      };

      expect(agent['validateOutput'](output)).toBe(true);
    });

    it('should reject missing menuSections', () => {
      const output = {
        metadata: {
          totalItems: 0,
          extractionQuality: 'high',
          confidenceScore: 0.9,
          processingTime: 1000,
        },
      } as VEAOutput;

      expect(agent['validateOutput'](output)).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should transform invalid MIME type error', () => {
      const error = new Error('Invalid MIME type: text/plain');
      const transformed = agent['handleError'](error);

      expect(transformed.message).toContain('VEA_INVALID_IMAGE');
      expect(transformed.message).toContain(
        'Supported formats: JPEG, PNG, WebP, HEIC',
      );
    });

    it('should transform Base64 error', () => {
      const error = new Error('Base64 decoding failed');
      const transformed = agent['handleError'](error);

      expect(transformed.message).toContain('VEA_INVALID_BASE64');
      expect(transformed.message).toContain('properly encoded');
    });

    it('should transform timeout error', () => {
      const error = new Error('Agent timeout after 15000ms');
      const transformed = agent['handleError'](error);

      expect(transformed.message).toContain('VEA_TIMEOUT');
      expect(transformed.message).toContain('too long');
    });

    it('should wrap generic errors', () => {
      const error = new Error('Unknown error');
      const transformed = agent['handleError'](error);

      expect(transformed.message).toContain('VEA_ERROR');
      expect(transformed.message).toContain('Unknown error');
    });
  });

  describe('buildExtractionPrompt', () => {
    it('should build full extraction prompt', () => {
      const input: VEAInput = {
        imageData: 'base64...',
        mimeType: 'image/jpeg',
        language: 'vi',
        extractionMode: 'full',
      };

      const prompt = agent['buildExtractionPrompt'](input);

      expect(prompt).toContain('Language: vi');
      expect(prompt).toContain('Mode: full');
      expect(prompt).toContain('FULL extraction');
      expect(prompt).toContain('ALL menu items');
    });

    it('should build quick extraction prompt', () => {
      const input: VEAInput = {
        imageData: 'base64...',
        mimeType: 'image/jpeg',
        extractionMode: 'quick',
      };

      const prompt = agent['buildExtractionPrompt'](input);

      expect(prompt).toContain('Mode: quick');
      expect(prompt).toContain('QUICK extraction');
      expect(prompt).toContain('only dish names and prices');
    });

    it('should default to Vietnamese and full mode', () => {
      const input: VEAInput = {
        imageData: 'base64...',
        mimeType: 'image/jpeg',
      };

      const prompt = agent['buildExtractionPrompt'](input);

      expect(prompt).toContain('Language: vi');
      expect(prompt).toContain('Mode: full');
    });
  });

  // Note: Full integration tests with real Gemini API calls
  // should be in a separate e2e test file
});
