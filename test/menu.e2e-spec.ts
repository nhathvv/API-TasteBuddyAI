import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { MenuModule } from '@/modules/menu/menu.module';
import { VisualExtractionAgent } from '@/ai-agents/visual-extraction/visual-extraction.agent';
import { AllergenSafetyAgent } from '@/ai-agents/allergen-safety/allergen-safety.agent';
import { DietaryComplianceAgent } from '@/ai-agents/dietary-compliance/dietary-compliance.agent';
import { VEAOutput } from '@/ai-agents/visual-extraction/visual-extraction.schema';
import { CSAAOutput } from '@/ai-agents/allergen-safety/allergen-safety.schema';
import { DCAOutput } from '@/ai-agents/dietary-compliance/dietary-compliance.schema';

describe('MenuModule (e2e)', () => {
  let app: INestApplication;

  const extractionMock: VEAOutput = {
    restaurantName: 'Test Pho House',
    menuSections: [
      {
        sectionName: 'Phở',
        items: [
          { name: 'Phở Bò', description: 'Beef noodle soup', price: 65000 },
          { name: 'Phở Chay', description: 'Vegetarian pho', price: 60000 },
        ],
      },
    ],
    metadata: {
      totalItems: 2,
      extractionQuality: 'high',
      confidence: 0.92,
      processingTimeMs: 1200,
      detectedLanguages: ['vi'],
      notes: [],
    },
  };

  const allergenMock: CSAAOutput = {
    analysis: [
      {
        dishName: 'Phở Bò',
        riskLevel: 'HIGH_RISK',
        identifiedAllergens: [
          {
            allergen: 'peanuts',
            source: 'Peanut garnish risk',
            likelihood: 'possible',
            severity: 'severe',
          },
        ],
        reasoning: 'Contains beef broth and potential peanut garnishes.',
        confidenceScore: 0.78,
      },
    ],
    summary: {
      safeItems: 1,
      lowRiskItems: 0,
      mediumRiskItems: 0,
      highRiskItems: 1,
      severeRiskItems: 0,
      unknownRiskItems: 0,
      totalItems: 2,
    },
    recommendations: ['Ask to omit peanuts and confirm broth ingredients.'],
  };

  const complianceMock: DCAOutput = {
    results: [
      {
        dishName: 'Phở Bò',
        status: 'NON_COMPLIANT',
        confidence: 'high',
        complianceScore: 0.1,
        nonCompliantIngredients: [
          {
            ingredient: 'Beef',
            reason: 'Not permitted for vegan diets',
            violates: 'vegan',
            confidence: 'high',
          },
        ],
        compliantIngredients: ['Rice noodles', 'Herbs'],
        uncertainIngredients: [],
        reasoning: 'Beef broth and meat violate vegan restrictions.',
        alternatives: [],
      },
      {
        dishName: 'Phở Chay',
        status: 'LIKELY_COMPLIANT',
        confidence: 'medium',
        complianceScore: 0.85,
        nonCompliantIngredients: [],
        compliantIngredients: ['Tofu', 'Vegetables'],
        uncertainIngredients: ['Broth base'],
        reasoning: 'Vegetarian-friendly but verify broth has no fish sauce.',
        alternatives: [],
      },
    ],
    summary: {
      totalDishes: 2,
      compliantCount: 1,
      nonCompliantCount: 1,
      uncertainCount: 0,
      complianceRate: 0.5,
    },
    recommendations: ['Confirm vegetable broth for Phở Chay.'],
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MenuModule],
    })
      .overrideProvider(VisualExtractionAgent)
      .useValue({
        execute: jest.fn().mockResolvedValue(extractionMock),
      })
      .overrideProvider(AllergenSafetyAgent)
      .useValue({
        execute: jest.fn().mockResolvedValue(allergenMock),
      })
      .overrideProvider(DietaryComplianceAgent)
      .useValue({
        execute: jest.fn().mockResolvedValue(complianceMock),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /menu/scan orchestrates agents and aggregates results', async () => {
    const response = await request(app.getHttpServer())
      .post('/menu/scan')
      .send({
        imageData: 'base64-image',
        mimeType: 'image/png',
        dietaryRestrictions: ['vegan'],
        userAllergens: [{ type: 'peanuts', severity: 'severe' }],
      })
      .expect(201);

    expect(response.body.extraction.metadata.totalItems).toBe(2);
    expect(response.body.allergenAnalysis.summary.highRiskItems).toBe(1);
    expect(response.body.dietaryCompliance.summary.nonCompliantCount).toBe(1);
    expect(response.body.timeline.total).toBe(2);
    expect(response.body.timeline.failed).toBe(0);
  });
});
