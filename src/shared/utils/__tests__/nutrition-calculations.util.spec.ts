import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  applyGoalAdjustment,
  calculateFiber,
  calculateSodiumLimit,
  calculateSugarLimit,
} from '../nutrition-calculations.util';

describe('NutritionCalculationsUtil', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR correctly for male using Mifflin-St Jeor equation', () => {
      // Arrange
      const weight = 70; // kg
      const height = 175; // cm
      const age = 30;
      const gender = 'male' as const;

      // Act
      const result = calculateBMR(weight, height, age, gender);

      // Assert
      // BMR = 10 × 70 + 6.25 × 175 - 5 × 30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
      expect(result).toBeCloseTo(1648.75, 1);
    });

    it('should calculate BMR correctly for female', () => {
      const result = calculateBMR(60, 165, 25, 'female');
      // BMR = 10 × 60 + 6.25 × 165 - 5 × 25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      expect(result).toBeCloseTo(1345.25, 1);
    });

    it('should use female formula for "other" gender', () => {
      const maleResult = calculateBMR(70, 175, 30, 'male');
      const otherResult = calculateBMR(70, 175, 30, 'other');

      expect(otherResult).toBeLessThan(maleResult);
      expect(otherResult).toBeCloseTo(1482.75, 1); // With -161 instead of +5
    });

    it('should handle edge case of age 0', () => {
      const result = calculateBMR(70, 175, 0, 'male');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeCloseTo(1798.75, 1);
    });

    it('should handle very low weight', () => {
      const result = calculateBMR(40, 150, 25, 'female');
      expect(result).toBeGreaterThan(0);
    });

    it('should throw error for negative weight', () => {
      expect(() => calculateBMR(-70, 175, 30, 'male')).toThrow();
    });

    it('should throw error for negative height', () => {
      expect(() => calculateBMR(70, -175, 30, 'male')).toThrow();
    });

    it('should throw error for negative age', () => {
      expect(() => calculateBMR(70, 175, -30, 'male')).toThrow();
    });

    it('should throw error for zero weight', () => {
      expect(() => calculateBMR(0, 175, 30, 'male')).toThrow();
    });
  });

  describe('calculateTDEE', () => {
    const bmr = 1656.25;

    it('should apply sedentary multiplier correctly (1.2)', () => {
      const result = calculateTDEE(bmr, 'sedentary');
      expect(result).toBeCloseTo(1988, 0); // 1656.25 × 1.2 ≈ 1988
    });

    it('should apply light multiplier correctly (1.375)', () => {
      const result = calculateTDEE(bmr, 'light');
      expect(result).toBeCloseTo(2277, 0); // 1656.25 × 1.375
    });

    it('should apply moderate multiplier correctly (1.55)', () => {
      const result = calculateTDEE(bmr, 'moderate');
      expect(result).toBeCloseTo(2567, 0); // 1656.25 × 1.55
    });

    it('should apply active multiplier correctly (1.725)', () => {
      const result = calculateTDEE(bmr, 'active');
      expect(result).toBeCloseTo(2857, 0); // 1656.25 × 1.725
    });

    it('should apply very-active multiplier correctly (1.9)', () => {
      const result = calculateTDEE(bmr, 'very-active');
      expect(result).toBeCloseTo(3147, 0); // 1656.25 × 1.9
    });

    it('should return rounded integer', () => {
      const result = calculateTDEE(bmr, 'moderate');
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('calculateMacros', () => {
    it('should distribute macros correctly for weight loss (35/40/25)', () => {
      const calories = 2000;
      const goal = 'lose-weight' as const;

      const result = calculateMacros(calories, goal);

      // Weight loss: 35% protein, 40% carbs, 25% fats
      expect(result.protein).toBe(175); // (2000 × 0.35) / 4 = 175g
      expect(result.carbs).toBe(200); // (2000 × 0.40) / 4 = 200g
      expect(result.fats).toBe(56); // (2000 × 0.25) / 9 ≈ 56g
      expect(result.calories).toBe(2000);

      expect(result.macroRatio.protein).toBe(35);
      expect(result.macroRatio.carbs).toBe(40);
      expect(result.macroRatio.fats).toBe(25);
    });

    it('should distribute macros correctly for muscle gain (30/50/20)', () => {
      const result = calculateMacros(2500, 'gain-muscle');

      expect(result.protein).toBe(188); // (2500 × 0.30) / 4
      expect(result.carbs).toBe(313); // (2500 × 0.50) / 4
      expect(result.fats).toBe(56); // (2500 × 0.20) / 9
      expect(result.calories).toBe(2500);
    });

    it('should distribute macros correctly for maintenance (25/50/25)', () => {
      const result = calculateMacros(2200, 'maintain');

      expect(result.protein).toBe(138); // (2200 × 0.25) / 4
      expect(result.carbs).toBe(275); // (2200 × 0.50) / 4
      expect(result.fats).toBe(61); // (2200 × 0.25) / 9
    });

    it('should distribute macros correctly for health (20/55/25)', () => {
      const result = calculateMacros(2000, 'health');

      expect(result.protein).toBe(100); // (2000 × 0.20) / 4
      expect(result.carbs).toBe(275); // (2000 × 0.55) / 4
      expect(result.fats).toBe(56); // (2000 × 0.25) / 9
    });

    it('should return all values as integers', () => {
      const result = calculateMacros(2000, 'lose-weight');

      expect(Number.isInteger(result.protein)).toBe(true);
      expect(Number.isInteger(result.carbs)).toBe(true);
      expect(Number.isInteger(result.fats)).toBe(true);
    });
  });

  describe('applyGoalAdjustment', () => {
    const tdee = 2500;

    it('should apply 20% deficit for weight loss', () => {
      const result = applyGoalAdjustment(tdee, 'lose-weight');
      expect(result).toBe(2000); // 2500 × 0.8
    });

    it('should apply 15% surplus for muscle gain', () => {
      const result = applyGoalAdjustment(tdee, 'gain-muscle');
      expect(result).toBe(2875); // 2500 × 1.15
    });

    it('should not adjust for maintenance', () => {
      const result = applyGoalAdjustment(tdee, 'maintain');
      expect(result).toBe(2500); // No change
    });

    it('should not adjust for health goal', () => {
      const result = applyGoalAdjustment(tdee, 'health');
      expect(result).toBe(2500); // No change
    });
  });

  describe('calculateFiber', () => {
    it('should calculate fiber at 14g per 1000 calories', () => {
      const result = calculateFiber(2000, 'male');
      // 2000 / 1000 × 14 = 28g, but minimum for male is 30g
      expect(result).toBe(30);
    });

    it('should respect minimum fiber for males (30g)', () => {
      const result = calculateFiber(1500, 'male');
      // 1500 / 1000 × 14 = 21g, but minimum is 30g
      expect(result).toBe(30);
    });

    it('should respect minimum fiber for females (21g)', () => {
      const result = calculateFiber(1200, 'female');
      // 1200 / 1000 × 14 = 16.8g, but minimum is 21g
      expect(result).toBe(21);
    });

    it('should calculate higher fiber for high calorie diets', () => {
      const result = calculateFiber(3000, 'male');
      // 3000 / 1000 × 14 = 42g (above minimum)
      expect(result).toBe(42);
    });
  });

  describe('calculateSodiumLimit', () => {
    it('should return 2300mg for no health conditions (WHO standard)', () => {
      const result = calculateSodiumLimit([]);
      expect(result).toBe(2300);
    });

    it('should return 1500mg for hypertension (DASH diet)', () => {
      const result = calculateSodiumLimit(['hypertension']);
      expect(result).toBe(1500);
    });

    it('should return 1500mg for heart disease', () => {
      const result = calculateSodiumLimit(['heart-disease']);
      expect(result).toBe(1500);
    });

    it('should return 1500mg for high blood pressure', () => {
      const result = calculateSodiumLimit(['high-blood-pressure']);
      expect(result).toBe(1500);
    });

    it('should return 1000mg for kidney disease (most restrictive)', () => {
      const result = calculateSodiumLimit(['kidney-disease']);
      expect(result).toBe(1000);
    });

    it('should return 1000mg for chronic kidney disease', () => {
      const result = calculateSodiumLimit(['chronic-kidney-disease']);
      expect(result).toBe(1000);
    });

    it('should prioritize kidney disease over hypertension', () => {
      const result = calculateSodiumLimit(['hypertension', 'kidney-disease']);
      expect(result).toBe(1000); // Most restrictive wins
    });
  });

  describe('calculateSugarLimit', () => {
    it('should return WHO recommendation (10% of calories) for normal case', () => {
      const result = calculateSugarLimit(2000, 'maintain', []);
      // 2000 × 0.1 / 4 = 50g
      expect(result).toBe(50);
    });

    it('should return 25g for diabetes (strict control)', () => {
      const result = calculateSugarLimit(2000, 'maintain', ['diabetes']);
      expect(result).toBe(25);
    });

    it('should return 25g for type-2-diabetes', () => {
      const result = calculateSugarLimit(2000, 'maintain', ['type-2-diabetes']);
      expect(result).toBe(25);
    });

    it('should return 25g for pre-diabetes', () => {
      const result = calculateSugarLimit(2000, 'maintain', ['pre-diabetes']);
      expect(result).toBe(25);
    });

    it('should return 30g for weight loss goal', () => {
      const result = calculateSugarLimit(2000, 'lose-weight', []);
      expect(result).toBe(30);
    });

    it('should prioritize diabetes over weight loss goal', () => {
      const result = calculateSugarLimit(2000, 'lose-weight', ['diabetes']);
      expect(result).toBe(25); // Diabetes is stricter
    });

    it('should calculate based on calories for normal case', () => {
      const result = calculateSugarLimit(3000, 'maintain', []);
      // 3000 × 0.1 / 4 = 75g
      expect(result).toBe(75);
    });
  });
});
