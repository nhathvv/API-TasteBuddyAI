import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiCoreService } from '../gemini-core.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

describe('GeminiCoreService', () => {
  let service: GeminiCoreService;
  let configService: ConfigService;

  const mockApiKey = 'test-api-key-12345';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiCoreService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockApiKey),
          },
        },
      ],
    }).compile();

    service = module.get<GeminiCoreService>(GeminiCoreService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should throw error if GOOGLE_API_KEY is not defined', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      expect(() => {
        new GeminiCoreService(configService);
      }).toThrow('Missing GOOGLE_API_KEY');
    });

    it('should initialize successfully with valid API key', () => {
      expect(service).toBeDefined();
      expect(configService.get).toHaveBeenCalledWith('GOOGLE_API_KEY');
    });

    it('should call onModuleInit without errors', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });
  });

  describe('getModel', () => {
    it('should return a GenerativeModel instance', () => {
      service.onModuleInit();
      const model = service.getModel('gemini-1.5-pro');

      expect(model).toBeDefined();
      expect(typeof model.generateContent).toBe('function');
    });

    it('should accept custom model parameters', () => {
      service.onModuleInit();
      const systemInstruction = 'You are a helpful assistant';

      const model = service.getModel('gemini-1.5-pro', {
        systemInstruction,
      });

      expect(model).toBeDefined();
    });
  });

  describe('getProModel', () => {
    it('should return Gemini Pro model', () => {
      service.onModuleInit();
      const model = service.getProModel();

      expect(model).toBeDefined();
    });

    it('should accept system instructions', () => {
      service.onModuleInit();
      const model = service.getProModel({
        systemInstruction: 'You are a nutrition expert',
      });

      expect(model).toBeDefined();
    });
  });

  describe('getFlashModel', () => {
    it('should return Gemini Flash model', () => {
      service.onModuleInit();
      const model = service.getFlashModel();

      expect(model).toBeDefined();
    });

    it('should accept system instructions', () => {
      service.onModuleInit();
      const model = service.getFlashModel({
        systemInstruction: 'You are an OCR specialist',
      });

      expect(model).toBeDefined();
    });
  });

  describe('sanitizeBase64', () => {
    it('should remove data URI prefix from Base64 string', () => {
      const withPrefix = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUg';
      const expected = 'iVBORw0KGgoAAAANSUhEUg';

      const result = service.sanitizeBase64(withPrefix);

      expect(result).toBe(expected);
    });

    it('should return clean Base64 if no prefix present', () => {
      const cleanBase64 = 'iVBORw0KGgoAAAANSUhEUg';

      const result = service.sanitizeBase64(cleanBase64);

      expect(result).toBe(cleanBase64);
    });

    it('should handle different image types in data URI', () => {
      const pngPrefix = 'data:image/png;base64,abc123';
      const webpPrefix = 'data:image/webp;base64,abc123';

      expect(service.sanitizeBase64(pngPrefix)).toBe('abc123');
      expect(service.sanitizeBase64(webpPrefix)).toBe('abc123');
    });
  });

  describe('isValidImageMimeType', () => {
    it('should return true for valid MIME types', () => {
      expect(service.isValidImageMimeType('image/jpeg')).toBe(true);
      expect(service.isValidImageMimeType('image/png')).toBe(true);
      expect(service.isValidImageMimeType('image/webp')).toBe(true);
      expect(service.isValidImageMimeType('image/heic')).toBe(true);
    });

    it('should return false for invalid MIME types', () => {
      expect(service.isValidImageMimeType('text/plain')).toBe(false);
      expect(service.isValidImageMimeType('application/json')).toBe(false);
      expect(service.isValidImageMimeType('image/svg+xml')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(service.isValidImageMimeType('IMAGE/JPEG')).toBe(true);
      expect(service.isValidImageMimeType('Image/PNG')).toBe(true);
    });
  });

  describe('getClient', () => {
    it('should return GoogleGenerativeAI instance', () => {
      service.onModuleInit();
      const client = service.getClient();

      expect(client).toBeInstanceOf(GoogleGenerativeAI);
    });
  });

  // Note: generateContent tests would require mocking the Gemini API
  // For now, we trust the Google SDK implementation
  // Integration tests will cover actual API calls
});
