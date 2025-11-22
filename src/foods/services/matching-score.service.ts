import { Injectable, Logger } from '@nestjs/common';
import {
  HealthGoal,
  DietaryPreference,
  Allergen,
  NutritionGoals,
  DailyTargets,
} from '../../onboarding/schemas/onboarding.schema';
import { Food, NutritionInfo } from '../schemas/food.schema';
import { FoodMatchingDetails } from '../dto/food-search-result.dto';

interface UserHealthProfile {
  nutritionGoals: NutritionGoals;
  dailyTargets: DailyTargets;
  dietaryPreferences: DietaryPreference[];
  allergens: Allergen[];
}

@Injectable()
export class MatchingScoreService {
  private readonly logger = new Logger(MatchingScoreService.name);

  calculateMatchingScore(
    food: Food,
    userProfile: UserHealthProfile,
    budget?: number,
  ): FoodMatchingDetails {
    const healthGoalScore = this.calculateHealthGoalScore(
      food,
      userProfile.nutritionGoals.goal,
      userProfile.dailyTargets,
    );

    const nutritionScore = this.calculateNutritionScore(
      food.nutritionInfo,
      userProfile.dailyTargets,
    );

    const dietaryScore = this.calculateDietaryScore(
      food,
      userProfile.dietaryPreferences,
    );

    const allergenScore = this.calculateAllergenScore(
      food,
      userProfile.allergens,
    );

    const budgetScore = budget
      ? this.calculateBudgetScore(food.price, budget)
      : 100;

    // Weighted average calculation
    const weights = {
      healthGoal: 0.3,
      nutrition: 0.25,
      dietary: 0.2,
      allergen: 0.15,
      budget: 0.1,
    };

    const matchingScore =
      healthGoalScore * weights.healthGoal +
      nutritionScore * weights.nutrition +
      dietaryScore * weights.dietary +
      allergenScore * weights.allergen +
      budgetScore * weights.budget;

    const reasons = this.generateReasons(
      food,
      userProfile,
      {
        healthGoalScore,
        nutritionScore,
        dietaryScore,
        allergenScore,
        budgetScore,
      },
      budget,
    );

    return {
      matchingScore: Math.round(matchingScore * 10) / 10,
      healthGoalScore: Math.round(healthGoalScore),
      nutritionScore: Math.round(nutritionScore),
      dietaryScore: Math.round(dietaryScore),
      allergenScore: Math.round(allergenScore),
      budgetScore: Math.round(budgetScore),
      reasons,
    };
  }

  private calculateHealthGoalScore(
    food: Food,
    goal: HealthGoal,
    dailyTargets: DailyTargets,
  ): number {
    const nutrition = food.nutritionInfo;
    let score = 50; // Base score

    switch (goal) {
      case 'lose-weight':
        // Prefer low calories, high protein, high fiber
        if (nutrition.calories < dailyTargets.calories / 4) score += 20;
        if (nutrition.protein > dailyTargets.protein / 4) score += 15;
        if (nutrition.fiber > 5) score += 10;
        if (nutrition.sugar < 10) score += 5;
        break;

      case 'gain-muscle':
        // Prefer high protein, moderate carbs, moderate calories
        if (nutrition.protein > dailyTargets.protein / 3) score += 25;
        if (nutrition.calories > dailyTargets.calories / 4) score += 10;
        if (nutrition.carbs > dailyTargets.carbs / 4) score += 10;
        if (nutrition.fats > dailyTargets.fats / 4) score += 5;
        break;

      case 'maintain':
        // Balanced nutrition
        const calorieRatio = nutrition.calories / (dailyTargets.calories / 3);
        const proteinRatio = nutrition.protein / (dailyTargets.protein / 3);
        const carbsRatio = nutrition.carbs / (dailyTargets.carbs / 3);
        const fatsRatio = nutrition.fats / (dailyTargets.fats / 3);

        // Closer to 1.0 is better (meaning balanced)
        const balanceScore =
          100 -
          Math.abs(1 - calorieRatio) * 10 -
          Math.abs(1 - proteinRatio) * 10 -
          Math.abs(1 - carbsRatio) * 10 -
          Math.abs(1 - fatsRatio) * 10;

        score = Math.max(0, Math.min(100, balanceScore));
        break;
    }

    // Check if food is marked as suitable for this goal
    if (food.suitableForGoals?.includes(goal)) {
      score += 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateNutritionScore(
    nutrition: NutritionInfo,
    dailyTargets: DailyTargets,
  ): number {
    let score = 50; // Base score

    // Protein quality (higher is better)
    if (nutrition.protein > 20) score += 15;
    else if (nutrition.protein > 10) score += 10;

    // Fiber content (higher is better)
    if (nutrition.fiber > 5) score += 10;
    else if (nutrition.fiber > 3) score += 5;

    // Sugar content (lower is better)
    if (nutrition.sugar < 5) score += 10;
    else if (nutrition.sugar < 10) score += 5;
    else if (nutrition.sugar > 20) score -= 10;

    // Sodium content (lower is better)
    if (nutrition.sodium < 500) score += 10;
    else if (nutrition.sodium < 1000) score += 5;
    else if (nutrition.sodium > 2000) score -= 10;

    // Calorie appropriateness (not too high, not too low)
    if (nutrition.calories >= 300 && nutrition.calories <= 700) score += 15;
    else if (nutrition.calories < 200 || nutrition.calories > 1000) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateDietaryScore(
    food: Food,
    preferences: DietaryPreference[],
  ): number {
    if (!preferences || preferences.length === 0) {
      return 100; // No preferences to match
    }

    const matchedPreferences = preferences.filter((pref) =>
      food.dietaryPreferences?.includes(pref),
    );

    const matchRatio = matchedPreferences.length / preferences.length;
    return matchRatio * 100;
  }

  private calculateAllergenScore(food: Food, allergens: Allergen[]): number {
    if (!allergens || allergens.length === 0) {
      return 100; // No allergens to avoid
    }

    const foodAllergens = food.allergens || [];
    const dangerousAllergens = allergens.filter((allergen) =>
      foodAllergens.includes(allergen.type),
    );

    if (dangerousAllergens.length === 0) {
      return 100; // No allergen conflicts
    }

    // Severe penalty for any allergen match
    const severePenalty = dangerousAllergens.some(
      (a) => a.severity === 'severe',
    )
      ? 100
      : 0;
    const moderatePenalty = dangerousAllergens.some(
      (a) => a.severity === 'moderate',
    )
      ? 50
      : 0;
    const mildPenalty = dangerousAllergens.some((a) => a.severity === 'mild')
      ? 25
      : 0;

    const totalPenalty = Math.max(severePenalty, moderatePenalty, mildPenalty);
    return Math.max(0, 100 - totalPenalty);
  }

  private calculateBudgetScore(price: number, budget: number): number {
    if (price <= budget) {
      // Within budget, score based on how much budget is left
      const ratio = price / budget;
      return 100 - ratio * 20; // Higher score for leaving more budget
    } else {
      // Over budget, penalty based on how much over
      const overRatio = (price - budget) / budget;
      return Math.max(0, 100 - overRatio * 100);
    }
  }

  private generateReasons(
    food: Food,
    userProfile: UserHealthProfile,
    scores: {
      healthGoalScore: number;
      nutritionScore: number;
      dietaryScore: number;
      allergenScore: number;
      budgetScore: number;
    },
    budget?: number,
  ): string[] {
    const reasons: string[] = [];
    const goal = userProfile.nutritionGoals.goal;
    const nutrition = food.nutritionInfo;

    // Health goal reasons
    if (scores.healthGoalScore > 70) {
      if (goal === 'lose-weight') {
        if (nutrition.calories < 400) {
          reasons.push('Low calorie content supports weight loss');
        }
        if (nutrition.protein > 20) {
          reasons.push('High protein helps maintain muscle during weight loss');
        }
        if (nutrition.fiber > 5) {
          reasons.push('High fiber promotes fullness and digestion');
        }
      } else if (goal === 'gain-muscle') {
        if (nutrition.protein > 25) {
          reasons.push('Excellent protein content for muscle building');
        }
        if (nutrition.carbs > 30) {
          reasons.push('Good carbs for energy and recovery');
        }
      } else if (goal === 'maintain') {
        reasons.push('Well-balanced nutrition for weight maintenance');
      }
    }

    // Nutrition quality reasons
    if (nutrition.sugar < 5) {
      reasons.push('Very low in sugar');
    }
    if (nutrition.sodium < 500) {
      reasons.push('Low sodium content');
    }
    if (nutrition.fiber > 5) {
      reasons.push('Rich in dietary fiber');
    }

    // Dietary preferences
    if (scores.dietaryScore === 100 && userProfile.dietaryPreferences.length > 0) {
      reasons.push(
        `Matches all your dietary preferences (${userProfile.dietaryPreferences.join(', ')})`,
      );
    }

    // Allergen safety
    if (scores.allergenScore === 100 && userProfile.allergens.length > 0) {
      reasons.push('Safe from your allergens');
    } else if (scores.allergenScore < 50) {
      const dangerousAllergens = userProfile.allergens
        .filter((a) => food.allergens?.includes(a.type))
        .map((a) => a.type);
      reasons.push(`⚠️ Contains allergens: ${dangerousAllergens.join(', ')}`);
    }

    // Budget
    if (budget) {
      if (scores.budgetScore > 80) {
        const savings = budget - food.price;
        reasons.push(`Great value, ${savings.toLocaleString('vi-VN')} VND under budget`);
      } else if (scores.budgetScore < 50) {
        const over = food.price - budget;
        reasons.push(`${over.toLocaleString('vi-VN')} VND over your budget`);
      }
    }

    // Rating
    if (food.rating && food.rating >= 4.5) {
      reasons.push(`Highly rated (${food.rating}⭐)`);
    }

    return reasons.slice(0, 5); // Return top 5 reasons
  }
}
