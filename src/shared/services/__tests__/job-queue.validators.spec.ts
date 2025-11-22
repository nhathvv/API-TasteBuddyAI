import {
  validateDishInfo,
  validateAllergenSummary,
  validatePriceAnalysis,
  validateJobMetadata,
  shouldRetryBasedOnValidation,
  formatValidationResult,
} from '../job-queue.validators';
import { DishInfo, AllergenSummary, PriceAnalysis, JobMetadata } from '../job-queue.types';

describe('JobQueueValidators', () => {
  describe('validateDishInfo', () => {
    it('should pass validation for valid dish', () => {
      const dish: DishInfo = {
        name: 'Phở Bò',
        canonicalName: 'Pho Bo',
        ingredients: 'beef, noodles, herbs',
        price: 50000,
      };

      const result = validateDishInfo(dish);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when name is empty', () => {
      const dish: DishInfo = {
        name: '',
        canonicalName: 'Pho Bo',
        ingredients: 'beef',
        price: 50000,
      };

      const result = validateDishInfo(dish);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dish name is required');
    });

    it('should fail when price is negative', () => {
      const dish: DishInfo = {
        name: 'Phở Bò',
        canonicalName: 'Pho Bo',
        ingredients: 'beef',
        price: -1000,
      };

      const result = validateDishInfo(dish);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('negative price'))).toBe(true);
    });

    it('should warn when price is zero', () => {
      const dish: DishInfo = {
        name: 'Phở Bò',
        canonicalName: 'Pho Bo',
        ingredients: 'beef',
        price: 0,
      };

      const result = validateDishInfo(dish);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('zero price'))).toBe(true);
    });

    it('should warn when ingredients are empty', () => {
      const dish: DishInfo = {
        name: 'Phở Bò',
        canonicalName: 'Pho Bo',
        ingredients: '',
        price: 50000,
      };

      const result = validateDishInfo(dish);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('no ingredients'))).toBe(true);
    });

    it('should warn when price is unrealistic', () => {
      const dish: DishInfo = {
        name: 'Phở Bò',
        canonicalName: 'Pho Bo',
        ingredients: 'beef',
        price: 100, // Too low
      };

      const result = validateDishInfo(dish);

      expect(result.warnings.some(w => w.includes('unusual price'))).toBe(true);
    });
  });

  describe('validateAllergenSummary', () => {
    it('should pass validation for valid summary', () => {
      const summary: AllergenSummary = {
        safeItems: 2,
        unsafeItems: 1,
        overallRisk: 'moderate',
        details: [
          {
            dishName: 'Dish 1',
            riskLevel: 'SAFE',
            allergens: [],
          },
          {
            dishName: 'Dish 2',
            riskLevel: 'SAFE',
            allergens: [],
          },
          {
            dishName: 'Dish 3',
            riskLevel: 'MODERATE_RISK',
            allergens: [
              {
                type: 'shellfish',
                source: 'fish sauce',
                likelihood: 'high',
                severity: 'moderate',
              },
            ],
          },
        ],
      };

      const result = validateAllergenSummary(summary);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when counts are negative', () => {
      const summary: AllergenSummary = {
        safeItems: -1,
        unsafeItems: 0,
        overallRisk: 'low',
        details: [],
      };

      const result = validateAllergenSummary(summary);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be negative'))).toBe(true);
    });

    it('should fail when counts mismatch', () => {
      const summary: AllergenSummary = {
        safeItems: 2,
        unsafeItems: 1,
        overallRisk: 'low',
        details: [
          {
            dishName: 'Dish 1',
            riskLevel: 'SAFE',
            allergens: [],
          },
        ], // Only 1 detail but total should be 3
      };

      const result = validateAllergenSummary(summary);

      expect(result.errors.some(e => e.includes('count mismatch'))).toBe(true);
    });

    it('should warn when SAFE dish has allergens', () => {
      const summary: AllergenSummary = {
        safeItems: 1,
        unsafeItems: 0,
        overallRisk: 'low',
        details: [
          {
            dishName: 'Dish 1',
            riskLevel: 'SAFE',
            allergens: [
              {
                type: 'shellfish',
                source: 'fish sauce',
                likelihood: 'high',
                severity: 'moderate',
              },
            ],
          },
        ],
      };

      const result = validateAllergenSummary(summary);

      expect(result.warnings.some(w => w.includes('marked as SAFE but has'))).toBe(true);
    });

    it('should warn when unsafe dish has no allergens', () => {
      const summary: AllergenSummary = {
        safeItems: 0,
        unsafeItems: 1,
        overallRisk: 'high',
        details: [
          {
            dishName: 'Dish 1',
            riskLevel: 'HIGH_RISK',
            allergens: [],
          },
        ],
      };

      const result = validateAllergenSummary(summary);

      expect(result.warnings.some(w => w.includes('but has no allergens'))).toBe(true);
    });
  });

  describe('validatePriceAnalysis', () => {
    it('should pass validation for valid analysis', () => {
      const analysis: PriceAnalysis = {
        averagePrice: 50000,
        minPrice: 20000,
        maxPrice: 100000,
        dishCount: 5,
      };

      const result = validatePriceAnalysis(analysis);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when prices are negative', () => {
      const analysis: PriceAnalysis = {
        averagePrice: -50000,
        minPrice: 20000,
        maxPrice: 100000,
        dishCount: 5,
      };

      const result = validatePriceAnalysis(analysis);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be negative'))).toBe(true);
    });

    it('should fail when min > max', () => {
      const analysis: PriceAnalysis = {
        averagePrice: 50000,
        minPrice: 100000,
        maxPrice: 20000,
        dishCount: 5,
      };

      const result = validatePriceAnalysis(analysis);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('greater than max'))).toBe(true);
    });

    it('should fail when average is outside min-max range', () => {
      const analysis: PriceAnalysis = {
        averagePrice: 150000,
        minPrice: 20000,
        maxPrice: 100000,
        dishCount: 5,
      };

      const result = validatePriceAnalysis(analysis);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('outside min-max range'))).toBe(true);
    });

    it('should warn when dish count is zero', () => {
      const analysis: PriceAnalysis = {
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        dishCount: 0,
      };

      const result = validatePriceAnalysis(analysis);

      expect(result.warnings.some(w => w.includes('No dishes analyzed'))).toBe(true);
    });

    it('should warn for very large price range', () => {
      const analysis: PriceAnalysis = {
        averagePrice: 3000000,
        minPrice: 10000,
        maxPrice: 6000000,
        dishCount: 5,
      };

      const result = validatePriceAnalysis(analysis);

      expect(result.warnings.some(w => w.includes('Very large price range'))).toBe(true);
    });
  });

  describe('validateJobMetadata', () => {
    it('should pass validation for complete valid metadata', () => {
      const metadata: JobMetadata = {
        dishes: [
          {
            name: 'Phở Bò',
            canonicalName: 'Pho Bo',
            ingredients: 'beef, noodles',
            price: 50000,
          },
        ],
        allergenSummary: {
          safeItems: 1,
          unsafeItems: 0,
          overallRisk: 'low',
          details: [
            {
              dishName: 'Phở Bò',
              riskLevel: 'SAFE',
              allergens: [],
            },
          ],
        },
        priceAnalysis: {
          averagePrice: 50000,
          minPrice: 50000,
          maxPrice: 50000,
          dishCount: 1,
        },
      };

      const result = validateJobMetadata(metadata);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should aggregate errors from all validators', () => {
      const metadata: JobMetadata = {
        dishes: [
          {
            name: '',
            canonicalName: 'Pho Bo',
            ingredients: 'beef',
            price: -1000,
          },
        ],
        allergenSummary: {
          safeItems: -1,
          unsafeItems: 0,
          overallRisk: 'low',
          details: [],
        },
        priceAnalysis: {
          averagePrice: -50000,
          minPrice: 20000,
          maxPrice: 100000,
          dishCount: 1,
        },
      };

      const result = validateJobMetadata(metadata);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Dish 1'))).toBe(true);
      expect(result.errors.some(e => e.includes('Allergen'))).toBe(true);
      expect(result.errors.some(e => e.includes('Price'))).toBe(true);
    });

    it('should cross-validate dish counts', () => {
      const metadata: JobMetadata = {
        dishes: [
          {
            name: 'Phở Bò',
            canonicalName: 'Pho Bo',
            ingredients: 'beef',
            price: 50000,
          },
        ],
        priceAnalysis: {
          averagePrice: 50000,
          minPrice: 50000,
          maxPrice: 50000,
          dishCount: 5, // Mismatch!
        },
      };

      const result = validateJobMetadata(metadata);

      expect(result.warnings.some(w => w.includes("doesn't match actual dishes"))).toBe(true);
    });
  });

  describe('shouldRetryBasedOnValidation', () => {
    it('should return true for critical errors', () => {
      const result = {
        isValid: false,
        errors: ['Dish name is required', 'Price is negative'],
        warnings: [],
      };

      expect(shouldRetryBasedOnValidation(result)).toBe(true);
    });

    it('should return false for warnings only', () => {
      const result = {
        isValid: true,
        errors: [],
        warnings: ['Price is zero'],
      };

      expect(shouldRetryBasedOnValidation(result)).toBe(false);
    });

    it('should return true for mismatch errors', () => {
      const result = {
        isValid: false,
        errors: ['Safe items count mismatch'],
        warnings: [],
      };

      expect(shouldRetryBasedOnValidation(result)).toBe(true);
    });
  });

  describe('formatValidationResult', () => {
    it('should format successful validation', () => {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain('✅ Validation passed');
    });

    it('should format failed validation with errors', () => {
      const result = {
        isValid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: ['Warning 1'],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain('❌ Validation failed');
      expect(formatted).toContain('🔴 Errors:');
      expect(formatted).toContain('Error 1');
      expect(formatted).toContain('Error 2');
      expect(formatted).toContain('⚠️  Warnings:');
      expect(formatted).toContain('Warning 1');
    });
  });
});
