/**
 * Nutrition Calculation Utilities
 *
 * Evidence-based formulas for calculating nutritional requirements:
 * - BMR: Mifflin-St Jeor Equation (most accurate for modern populations)
 * - TDEE: Total Daily Energy Expenditure
 * - Macros: Macro-nutrient distribution based on goals
 */

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very-active';
export type NutritionGoal =
  | 'lose-weight'
  | 'maintain'
  | 'gain-muscle'
  | 'health';

export interface NutritionTargets {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  fiber?: number; // grams
  sodium?: number; // mg
  sugar?: number; // grams
  macroRatio: {
    protein: number; // percentage
    carbs: number; // percentage
    fats: number; // percentage
  };
}

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 *
 * This is the most accurate formula for modern populations.
 *
 * Formula:
 * - Male: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
 * - Female: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
 *
 * @param weight - Weight in kilograms
 * @param height - Height in centimeters
 * @param age - Age in years
 * @param gender - Biological gender
 * @returns BMR in calories per day
 *
 * @throws {Error} If parameters are negative
 *
 * @example
 * const bmr = calculateBMR(70, 175, 30, 'male');
 * // Returns: ~1656 calories/day
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
): number {
  // Validation
  if (weight <= 0 || height <= 0 || age < 0) {
    throw new Error(
      'Weight, height, and age must be positive numbers',
    );
  }

  // Mifflin-St Jeor Equation
  const baseMetabolism = 10 * weight + 6.25 * height - 5 * age;

  if (gender === 'male') {
    return baseMetabolism + 5;
  } else {
    // Female and other default to female formula
    return baseMetabolism - 161;
  }
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 *
 * TDEE = BMR × Activity Multiplier
 *
 * Activity multipliers based on Harris-Benedict Equation:
 * - Sedentary (little/no exercise): 1.2
 * - Light (exercise 1-3 days/week): 1.375
 * - Moderate (exercise 3-5 days/week): 1.55
 * - Active (exercise 6-7 days/week): 1.725
 * - Very Active (hard exercise daily + physical job): 1.9
 *
 * @param bmr - Basal Metabolic Rate
 * @param activityLevel - Activity level
 * @returns TDEE in calories per day
 *
 * @example
 * const tdee = calculateTDEE(1656, 'moderate');
 * // Returns: ~2567 calories/day
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel,
): number {
  const multipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9,
  };

  return Math.round(bmr * multipliers[activityLevel]);
}

/**
 * Calculate Macro-nutrient Distribution
 *
 * Distributes calories across protein, carbs, and fats based on goal.
 *
 * Ratios:
 * - Weight Loss: 35% protein, 40% carbs, 25% fats (high protein for satiety)
 * - Maintain: 25% protein, 50% carbs, 25% fats (balanced)
 * - Gain Muscle: 30% protein, 50% carbs, 20% fats (high carbs for energy)
 * - Health: 20% protein, 55% carbs, 25% fats (whole foods focused)
 *
 * Calories per gram:
 * - Protein: 4 cal/g
 * - Carbs: 4 cal/g
 * - Fats: 9 cal/g
 *
 * @param calories - Target daily calories
 * @param goal - Nutrition goal
 * @returns Macro distribution in grams
 *
 * @example
 * const macros = calculateMacros(2000, 'lose-weight');
 * // Returns: { protein: 175g, carbs: 200g, fats: 56g }
 */
export function calculateMacros(
  calories: number,
  goal: NutritionGoal,
): NutritionTargets {
  let proteinPercent: number;
  let carbsPercent: number;
  let fatsPercent: number;

  switch (goal) {
    case 'lose-weight':
      proteinPercent = 0.35; // 35% for satiety and muscle preservation
      carbsPercent = 0.4; // 40% moderate carbs
      fatsPercent = 0.25; // 25% healthy fats
      break;

    case 'gain-muscle':
      proteinPercent = 0.3; // 30% for muscle synthesis
      carbsPercent = 0.5; // 50% for workout energy
      fatsPercent = 0.2; // 20% fats
      break;

    case 'health':
      proteinPercent = 0.2; // 20% adequate protein
      carbsPercent = 0.55; // 55% whole grain carbs
      fatsPercent = 0.25; // 25% healthy fats
      break;

    case 'maintain':
    default:
      proteinPercent = 0.25; // 25% balanced
      carbsPercent = 0.5; // 50% balanced
      fatsPercent = 0.25; // 25% balanced
      break;
  }

  // Calculate calories for each macro
  const proteinCalories = calories * proteinPercent;
  const carbsCalories = calories * carbsPercent;
  const fatsCalories = calories * fatsPercent;

  // Convert to grams (protein: 4cal/g, carbs: 4cal/g, fats: 9cal/g)
  const protein = Math.round(proteinCalories / 4);
  const carbs = Math.round(carbsCalories / 4);
  const fats = Math.round(fatsCalories / 9);

  return {
    calories,
    protein,
    carbs,
    fats,
    macroRatio: {
      protein: Math.round(proteinPercent * 100),
      carbs: Math.round(carbsPercent * 100),
      fats: Math.round(fatsPercent * 100),
    },
  };
}

/**
 * Apply calorie adjustment for weight goal
 *
 * - Weight Loss: 15-20% deficit (safe range)
 * - Weight Gain: 10-15% surplus (lean mass focus)
 * - Maintain: No adjustment
 *
 * @param tdee - Total Daily Energy Expenditure
 * @param goal - Nutrition goal
 * @returns Adjusted calorie target
 *
 * @example
 * const adjusted = applyGoalAdjustment(2500, 'lose-weight');
 * // Returns: 2000 (20% deficit)
 */
export function applyGoalAdjustment(
  tdee: number,
  goal: NutritionGoal,
): number {
  switch (goal) {
    case 'lose-weight':
      return Math.round(tdee * 0.8); // 20% deficit

    case 'gain-muscle':
      return Math.round(tdee * 1.15); // 15% surplus

    case 'maintain':
    case 'health':
    default:
      return tdee; // No adjustment
  }
}

/**
 * Calculate fiber requirement
 *
 * Recommended daily fiber:
 * - Men: 30-38g
 * - Women: 21-25g
 * - General: 14g per 1000 calories
 *
 * @param calories - Daily calorie target
 * @param gender - Biological gender
 * @returns Recommended fiber in grams
 */
export function calculateFiber(calories: number, gender: Gender): number {
  // Rule of thumb: 14g per 1000 calories
  const fiberByCalories = Math.round((calories / 1000) * 14);

  // Gender-based minimums
  const minFiber = gender === 'male' ? 30 : 21;

  return Math.max(fiberByCalories, minFiber);
}

/**
 * Calculate sodium limit based on health conditions
 *
 * - Normal: < 2300mg/day (WHO recommendation)
 * - Hypertension: < 1500mg/day (DASH diet)
 * - Heart Disease: < 1500mg/day
 * - Kidney Disease: < 1000mg/day
 *
 * @param healthConditions - Array of health conditions
 * @returns Maximum sodium in mg
 */
export function calculateSodiumLimit(
  healthConditions: string[],
): number {
  if (
    healthConditions.includes('kidney-disease') ||
    healthConditions.includes('chronic-kidney-disease')
  ) {
    return 1000; // Very restrictive
  }

  if (
    healthConditions.includes('hypertension') ||
    healthConditions.includes('heart-disease') ||
    healthConditions.includes('high-blood-pressure')
  ) {
    return 1500; // Restrictive (DASH diet)
  }

  return 2300; // Normal (WHO recommendation)
}

/**
 * Calculate sugar limit
 *
 * - Normal: < 50g/day (WHO: < 10% of calories)
 * - Diabetes: < 25g/day (strict control)
 * - Weight Loss: < 30g/day
 *
 * @param calories - Daily calorie target
 * @param goal - Nutrition goal
 * @param healthConditions - Health conditions
 * @returns Maximum sugar in grams
 */
export function calculateSugarLimit(
  calories: number,
  goal: NutritionGoal,
  healthConditions: string[],
): number {
  // Diabetes: very strict limit
  if (
    healthConditions.includes('diabetes') ||
    healthConditions.includes('type-2-diabetes') ||
    healthConditions.includes('pre-diabetes')
  ) {
    return 25;
  }

  // Weight loss: moderate restriction
  if (goal === 'lose-weight') {
    return 30;
  }

  // Normal: WHO recommendation (10% of calories)
  return Math.round((calories * 0.1) / 4);
}
