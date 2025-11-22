import { Injectable } from '@nestjs/common';
import { I18nService } from './i18n.service';

/**
 * Regional Price Ranges (in VND)
 * Based on Vietnamese cuisine typical pricing
 */
const REGIONAL_PRICE_RANGES = {
  'north_vietnam': {
    cheap: { min: 0, max: 40000 },
    moderate: { min: 40001, max: 80000 },
    expensive: { min: 80001, max: 150000 },
    premium: { min: 150001, max: Infinity },
  },
  'central_vietnam': {
    cheap: { min: 0, max: 35000 },
    moderate: { min: 35001, max: 70000 },
    expensive: { min: 70001, max: 120000 },
    premium: { min: 120001, max: Infinity },
  },
  'south_vietnam': {
    cheap: { min: 0, max: 45000 },
    moderate: { min: 45001, max: 90000 },
    expensive: { min: 90001, max: 180000 },
    premium: { min: 180001, max: Infinity },
  },
  'international': {
    cheap: { min: 0, max: 60000 },
    moderate: { min: 60001, max: 150000 },
    expensive: { min: 150001, max: 300000 },
    premium: { min: 300001, max: Infinity },
  },
};

/**
 * Ingredient Value Factors
 * Base prices for common ingredients (VND per serving)
 */
const INGREDIENT_VALUES = {
  // Proteins
  beef: 35000,
  pork: 25000,
  chicken: 20000,
  duck: 30000,
  shrimp: 40000,
  fish: 30000,
  crab: 60000,
  lobster: 150000,
  tofu: 5000,

  // Carbs
  rice: 5000,
  noodles: 8000,
  bread: 10000,
  vermicelli: 6000,

  // Vegetables
  vegetables: 10000,
  herbs: 5000,
  mushrooms: 15000,

  // Premium ingredients
  truffle: 200000,
  foie_gras: 180000,
  caviar: 250000,
  wagyu: 300000,
};

/**
 * Price Analysis Result
 */
export interface PriceAnalysis {
  // Basic info
  originalPrice: number;
  convertedPrice: {
    value: number;
    currency: string;
    symbol: string;
    formatted: string;
  };

  // Regional evaluation
  regional: {
    region: string;
    priceCategory: 'cheap' | 'moderate' | 'expensive' | 'premium';
    percentileInRegion: number; // 0-100
    evaluation: string; // Translated message
  };

  // Value analysis
  valueAnalysis: {
    estimatedCost: number;
    markup: number; // Percentage
    valueForMoney: 'excellent' | 'good' | 'fair' | 'poor';
    explanation: string;
  };

  // Ingredient breakdown
  ingredientCostBreakdown: Array<{
    ingredient: string;
    estimatedCost: number;
    percentage: number;
  }>;

  // Comparison
  comparison: {
    cheaperThan: number; // Percentage of similar dishes
    moreExpensiveThan: number; // Percentage of similar dishes
    averagePriceForType: number;
  };
}

/**
 * Price Analysis Service
 *
 * Analyzes dish pricing based on:
 * - Regional pricing standards
 * - Ingredient costs
 * - Value for money
 * - Market comparison
 */
@Injectable()
export class PriceAnalysisService {
  constructor(private readonly i18nService: I18nService) {}

  /**
   * Analyze dish price
   */
  analyzeDishPrice(
    price: number,
    dish: {
      name: string;
      ingredients?: Array<{ canonicalName?: string; name?: string; isPrimary?: boolean }>;
      cuisineRegion?: string;
      baseDishType?: string;
    },
    language: string = 'vi',
  ): PriceAnalysis {
    // 1. Determine region
    const region = this.determineRegion(dish.cuisineRegion);

    // 2. Categorize price
    const priceCategory = this.categorizePriceInRegion(price, region);

    // 3. Calculate percentile
    const percentile = this.calculatePercentile(price, region);

    // 4. Estimate ingredient costs
    const estimatedCost = this.estimateIngredientCost(dish.ingredients || []);

    // 5. Calculate markup
    const markup = ((price - estimatedCost) / estimatedCost) * 100;

    // 6. Value for money assessment
    const valueForMoney = this.assessValueForMoney(markup);

    // 7. Convert price to target currency
    const convertedPrice = this.i18nService.convertPrice(price, language);

    // 8. Ingredient breakdown
    const ingredientBreakdown = this.calculateIngredientBreakdown(
      dish.ingredients || [],
      estimatedCost,
    );

    // 9. Get regional evaluation text
    const evaluation = this.getRegionalEvaluation(priceCategory, region, language);

    // 10. Get value explanation
    const explanation = this.getValueExplanation(valueForMoney, markup, language);

    // 11. Market comparison
    const comparison = this.getMarketComparison(price, dish.baseDishType || 'unknown', region);

    return {
      originalPrice: price,
      convertedPrice,
      regional: {
        region,
        priceCategory,
        percentileInRegion: percentile,
        evaluation,
      },
      valueAnalysis: {
        estimatedCost,
        markup: Math.round(markup),
        valueForMoney,
        explanation,
      },
      ingredientCostBreakdown: ingredientBreakdown,
      comparison,
    };
  }

  /**
   * Determine region from cuisine region
   */
  private determineRegion(cuisineRegion?: string): string {
    if (!cuisineRegion) return 'south_vietnam'; // Default

    const regionMap: Record<string, string> = {
      north_vietnam: 'north_vietnam',
      hanoi: 'north_vietnam',
      central_vietnam: 'central_vietnam',
      hue: 'central_vietnam',
      danang: 'central_vietnam',
      south_vietnam: 'south_vietnam',
      saigon: 'south_vietnam',
      'ho-chi-minh': 'south_vietnam',
      international: 'international',
      western: 'international',
      asian: 'international',
    };

    return regionMap[cuisineRegion.toLowerCase()] || 'south_vietnam';
  }

  /**
   * Categorize price within region
   */
  private categorizePriceInRegion(
    price: number,
    region: string,
  ): 'cheap' | 'moderate' | 'expensive' | 'premium' {
    const ranges = REGIONAL_PRICE_RANGES[region] || REGIONAL_PRICE_RANGES['south_vietnam'];

    if (price >= ranges.premium.min) return 'premium';
    if (price >= ranges.expensive.min) return 'expensive';
    if (price >= ranges.moderate.min) return 'moderate';
    return 'cheap';
  }

  /**
   * Calculate percentile in region
   */
  private calculatePercentile(price: number, region: string): number {
    const ranges = REGIONAL_PRICE_RANGES[region] || REGIONAL_PRICE_RANGES['south_vietnam'];

    if (price <= ranges.cheap.max) {
      return Math.round((price / ranges.cheap.max) * 25);
    } else if (price <= ranges.moderate.max) {
      return Math.round(25 + ((price - ranges.moderate.min) / (ranges.moderate.max - ranges.moderate.min)) * 25);
    } else if (price <= ranges.expensive.max) {
      return Math.round(50 + ((price - ranges.expensive.min) / (ranges.expensive.max - ranges.expensive.min)) * 25);
    } else {
      return Math.min(100, Math.round(75 + ((price - ranges.premium.min) / 100000) * 25));
    }
  }

  /**
   * Estimate ingredient cost
   */
  private estimateIngredientCost(
    ingredients: Array<{ canonicalName?: string; name?: string; isPrimary?: boolean }>,
  ): number {
    let totalCost = 0;

    ingredients.forEach((ing) => {
      const ingredientName = (ing.canonicalName || ing.name || '').toLowerCase();
      const multiplier = ing.isPrimary ? 1.0 : 0.3; // Primary ingredients cost more

      // Match ingredient to base values
      Object.keys(INGREDIENT_VALUES).forEach((key) => {
        if (ingredientName.includes(key)) {
          totalCost += INGREDIENT_VALUES[key] * multiplier;
        }
      });
    });

    // Add base cost for preparation, overhead
    const baseCost = 15000;
    return totalCost > 0 ? totalCost + baseCost : baseCost * 2;
  }

  /**
   * Assess value for money
   */
  private assessValueForMoney(markup: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (markup < 50) return 'excellent'; // Less than 50% markup
    if (markup < 100) return 'good'; // 50-100% markup
    if (markup < 200) return 'fair'; // 100-200% markup
    return 'poor'; // Over 200% markup
  }

  /**
   * Calculate ingredient breakdown
   */
  private calculateIngredientBreakdown(
    ingredients: Array<{ canonicalName?: string; name?: string; isPrimary?: boolean }>,
    totalCost: number,
  ): Array<{ ingredient: string; estimatedCost: number; percentage: number }> {
    const breakdown: Array<{ ingredient: string; estimatedCost: number; percentage: number }> = [];

    ingredients.forEach((ing) => {
      const ingredientName = (ing.canonicalName || ing.name || '').toLowerCase();
      const multiplier = ing.isPrimary ? 1.0 : 0.3;

      let cost = 0;
      Object.keys(INGREDIENT_VALUES).forEach((key) => {
        if (ingredientName.includes(key)) {
          cost += INGREDIENT_VALUES[key] * multiplier;
        }
      });

      if (cost > 0) {
        breakdown.push({
          ingredient: ing.canonicalName || ing.name || 'unknown',
          estimatedCost: Math.round(cost),
          percentage: Math.round((cost / totalCost) * 100),
        });
      }
    });

    return breakdown.sort((a, b) => b.estimatedCost - a.estimatedCost).slice(0, 5); // Top 5
  }

  /**
   * Get regional evaluation text
   */
  private getRegionalEvaluation(
    category: string,
    region: string,
    language: string,
  ): string {
    const evaluations = {
      vi: {
        cheap: `Giá rẻ so với mức trung bình khu vực ${this.getRegionName(region, 'vi')}`,
        moderate: `Giá trung bình so với khu vực ${this.getRegionName(region, 'vi')}`,
        expensive: `Giá cao so với mức trung bình khu vực ${this.getRegionName(region, 'vi')}`,
        premium: `Giá cao cấp so với khu vực ${this.getRegionName(region, 'vi')}`,
      },
      en: {
        cheap: `Affordable compared to ${this.getRegionName(region, 'en')} average`,
        moderate: `Moderately priced for ${this.getRegionName(region, 'en')}`,
        expensive: `Above average for ${this.getRegionName(region, 'en')}`,
        premium: `Premium pricing for ${this.getRegionName(region, 'en')}`,
      },
      ko: {
        cheap: `${this.getRegionName(region, 'ko')} 평균보다 저렴`,
        moderate: `${this.getRegionName(region, 'ko')} 평균 가격`,
        expensive: `${this.getRegionName(region, 'ko')} 평균보다 비쌈`,
        premium: `${this.getRegionName(region, 'ko')} 프리미엄 가격`,
      },
      ja: {
        cheap: `${this.getRegionName(region, 'ja')}の平均より安い`,
        moderate: `${this.getRegionName(region, 'ja')}の平均価格`,
        expensive: `${this.getRegionName(region, 'ja')}の平均より高い`,
        premium: `${this.getRegionName(region, 'ja')}のプレミアム価格`,
      },
    };

    return evaluations[language]?.[category] || evaluations['en'][category];
  }

  /**
   * Get region name in language
   */
  private getRegionName(region: string, language: string): string {
    const names = {
      vi: {
        north_vietnam: 'Miền Bắc',
        central_vietnam: 'Miền Trung',
        south_vietnam: 'Miền Nam',
        international: 'Quốc tế',
      },
      en: {
        north_vietnam: 'Northern Vietnam',
        central_vietnam: 'Central Vietnam',
        south_vietnam: 'Southern Vietnam',
        international: 'International',
      },
      ko: {
        north_vietnam: '북부 베트남',
        central_vietnam: '중부 베트남',
        south_vietnam: '남부 베트남',
        international: '국제',
      },
      ja: {
        north_vietnam: '北ベトナム',
        central_vietnam: '中部ベトナム',
        south_vietnam: '南ベトナム',
        international: '国際',
      },
    };

    return names[language]?.[region] || names['en'][region] || region;
  }

  /**
   * Get value explanation
   */
  private getValueExplanation(
    valueForMoney: string,
    markup: number,
    language: string,
  ): string {
    const explanations = {
      vi: {
        excellent: `Giá trị tuyệt vời! Chỉ tăng ${markup}% so với chi phí nguyên liệu`,
        good: `Giá trị tốt với mức tăng ${markup}% hợp lý`,
        fair: `Giá trị chấp nhận được, tăng ${markup}% so với nguyên liệu`,
        poor: `Giá cao với mức tăng ${markup}% so với chi phí nguyên liệu`,
      },
      en: {
        excellent: `Excellent value! Only ${markup}% markup over ingredients`,
        good: `Good value with ${markup}% reasonable markup`,
        fair: `Fair value with ${markup}% markup`,
        poor: `Expensive with ${markup}% markup over ingredients`,
      },
      ko: {
        excellent: `훌륭한 가치! 재료비 대비 ${markup}%만 추가`,
        good: `${markup}% 합리적인 추가 요금으로 좋은 가치`,
        fair: `${markup}% 추가 요금으로 적절한 가치`,
        poor: `재료비 대비 ${markup}% 비싼 가격`,
      },
      ja: {
        excellent: `素晴らしい価値！材料費より${markup}%のみ追加`,
        good: `${markup}%の合理的な追加料金で良い価値`,
        fair: `${markup}%の追加料金で適切な価値`,
        poor: `材料費より${markup}%高い価格`,
      },
    };

    return explanations[language]?.[valueForMoney] || explanations['en'][valueForMoney];
  }

  /**
   * Get market comparison
   */
  private getMarketComparison(
    price: number,
    dishType: string,
    region: string,
  ): {
    cheaperThan: number;
    moreExpensiveThan: number;
    averagePriceForType: number;
  } {
    const ranges = REGIONAL_PRICE_RANGES[region] || REGIONAL_PRICE_RANGES['south_vietnam'];

    // Calculate average for dish type
    const avgPrice = (ranges.moderate.min + ranges.moderate.max) / 2;

    // Calculate percentages
    const percentile = this.calculatePercentile(price, region);
    const cheaperThan = 100 - percentile;
    const moreExpensiveThan = percentile;

    return {
      cheaperThan,
      moreExpensiveThan,
      averagePriceForType: avgPrice,
    };
  }
}
