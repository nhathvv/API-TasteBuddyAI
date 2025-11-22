import { SchemaType } from '@google/generative-ai';

/**
 * Dietary Restrictions/Preferences
 */
export type DietaryRestriction =
  | 'vegan'
  | 'vegetarian'
  | 'halal'
  | 'kosher'
  | 'low-carb'
  | 'keto'
  | 'paleo'
  | 'mediterranean'
  | 'gluten-free'
  | 'dairy-free'
  | 'pescatarian';

/**
 * Compliance Status
 */
export type ComplianceStatus =
  | 'COMPLIANT' // Fully compliant
  | 'LIKELY_COMPLIANT' // Probably compliant but uncertain
  | 'POSSIBLY_NON_COMPLIANT' // Might contain non-compliant ingredients
  | 'NON_COMPLIANT' // Definitely contains non-compliant ingredients
  | 'UNKNOWN'; // Cannot determine compliance

/**
 * Confidence Level
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Menu Item for Compliance Check
 */
export interface MenuItem {
  /** Dish name (Vietnamese or English) */
  name: string;

  /** Description or ingredients list (if available) */
  description?: string;

  /** Category (e.g., "Món Nước", "Món Khô") */
  category?: string;

  /** Known ingredients (if available) */
  ingredients?: string[];
}

/**
 * DCA Input Schema
 */
export interface DCAInput {
  /** Menu items to check */
  menuItems: MenuItem[];

  /** User's dietary restrictions */
  dietaryRestrictions: DietaryRestriction[];

  /** Additional context (optional) */
  context?: string;
}

/**
 * Non-Compliant Ingredient
 */
export interface NonCompliantIngredient {
  /** Ingredient name */
  ingredient: string;

  /** Why it's non-compliant */
  reason: string;

  /** Dietary restriction it violates */
  violates: DietaryRestriction;

  /** Confidence in this detection */
  confidence: ConfidenceLevel;
}

/**
 * Alternative Suggestion
 */
export interface Alternative {
  /** Suggested dish name */
  dishName: string;

  /** Why this is a good alternative */
  reason: string;

  /** How similar it is to the original (0.0-1.0) */
  similarityScore: number;
}

/**
 * Compliance Result for a Single Dish
 */
export interface ComplianceResult {
  /** Original dish name */
  dishName: string;

  /** Overall compliance status */
  status: ComplianceStatus;

  /** Confidence in this assessment */
  confidence: ConfidenceLevel;

  /** Compliance score (0.0 = non-compliant, 1.0 = fully compliant) */
  complianceScore: number;

  /** Non-compliant ingredients found */
  nonCompliantIngredients: NonCompliantIngredient[];

  /** Compliant ingredients (confirmed safe) */
  compliantIngredients: string[];

  /** Uncertain ingredients (need verification) */
  uncertainIngredients: string[];

  /** Chain-of-thought reasoning */
  reasoning: string;

  /** Alternative dishes (if non-compliant) */
  alternatives?: Alternative[];

  /** Additional notes or warnings */
  notes?: string[];
}

/**
 * DCA Output Schema
 */
export interface DCAOutput {
  /** Compliance results for each dish */
  results: ComplianceResult[];

  /** Summary statistics */
  summary: {
    /** Total dishes checked */
    totalDishes: number;

    /** Number of compliant dishes */
    compliantCount: number;

    /** Number of non-compliant dishes */
    nonCompliantCount: number;

    /** Number of uncertain dishes */
    uncertainCount: number;

    /** Overall compliance rate (0.0-1.0) */
    complianceRate: number;
  };

  /** General recommendations */
  recommendations: string[];

  /** Important warnings */
  warnings?: string[];
}

/**
 * Gemini JSON Schema for Dietary Compliance Agent Output
 */
export const DIETARY_COMPLIANCE_SCHEMA = {
  description: 'Dietary compliance check results',
  type: SchemaType.OBJECT,
  properties: {
    results: {
      type: SchemaType.ARRAY,
      description: 'Compliance results for each dish',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dishName: {
            type: SchemaType.STRING,
            description: 'Name of the dish',
          },
          status: {
            type: SchemaType.STRING,
            enum: [
              'COMPLIANT',
              'LIKELY_COMPLIANT',
              'POSSIBLY_NON_COMPLIANT',
              'NON_COMPLIANT',
              'UNKNOWN',
            ],
            description: 'Compliance status',
          },
          confidence: {
            type: SchemaType.STRING,
            enum: ['high', 'medium', 'low'],
            description: 'Confidence level',
          },
          complianceScore: {
            type: SchemaType.NUMBER,
            description: 'Compliance score 0.0-1.0',
          },
          nonCompliantIngredients: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                ingredient: { type: SchemaType.STRING },
                reason: { type: SchemaType.STRING },
                violates: {
                  type: SchemaType.STRING,
                  enum: [
                    'vegan',
                    'vegetarian',
                    'halal',
                    'kosher',
                    'low-carb',
                    'keto',
                    'paleo',
                    'mediterranean',
                    'gluten-free',
                    'dairy-free',
                    'pescatarian',
                  ],
                },
                confidence: {
                  type: SchemaType.STRING,
                  enum: ['high', 'medium', 'low'],
                },
              },
              required: ['ingredient', 'reason', 'violates', 'confidence'],
            },
          },
          compliantIngredients: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Confirmed compliant ingredients',
          },
          uncertainIngredients: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Ingredients needing verification',
          },
          reasoning: {
            type: SchemaType.STRING,
            description: 'Chain-of-thought reasoning (2-4 sentences)',
          },
          alternatives: {
            type: SchemaType.ARRAY,
            nullable: true,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                dishName: { type: SchemaType.STRING },
                reason: { type: SchemaType.STRING },
                similarityScore: {
                  type: SchemaType.NUMBER,
                  description: 'Similarity to original 0.0-1.0',
                },
              },
              required: ['dishName', 'reason', 'similarityScore'],
            },
          },
          notes: {
            type: SchemaType.ARRAY,
            nullable: true,
            items: { type: SchemaType.STRING },
          },
        },
        required: [
          'dishName',
          'status',
          'confidence',
          'complianceScore',
          'nonCompliantIngredients',
          'compliantIngredients',
          'uncertainIngredients',
          'reasoning',
        ],
      },
    },
    summary: {
      type: SchemaType.OBJECT,
      properties: {
        totalDishes: { type: SchemaType.NUMBER },
        compliantCount: { type: SchemaType.NUMBER },
        nonCompliantCount: { type: SchemaType.NUMBER },
        uncertainCount: { type: SchemaType.NUMBER },
        complianceRate: {
          type: SchemaType.NUMBER,
          description: 'Overall compliance rate 0.0-1.0',
        },
      },
      required: [
        'totalDishes',
        'compliantCount',
        'nonCompliantCount',
        'uncertainCount',
        'complianceRate',
      ],
    },
    recommendations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'General recommendations',
    },
    warnings: {
      type: SchemaType.ARRAY,
      nullable: true,
      items: { type: SchemaType.STRING },
      description: 'Important warnings',
    },
  },
  required: ['results', 'summary', 'recommendations'],
};

/**
 * Validation functions
 */

export function validateDCAInput(input: DCAInput): boolean {
  if (!input.menuItems || !Array.isArray(input.menuItems)) {
    throw new Error('menuItems must be an array');
  }

  if (input.menuItems.length === 0) {
    throw new Error('menuItems cannot be empty');
  }

  if (
    !input.dietaryRestrictions ||
    !Array.isArray(input.dietaryRestrictions)
  ) {
    throw new Error('dietaryRestrictions must be an array');
  }

  if (input.dietaryRestrictions.length === 0) {
    throw new Error(
      'dietaryRestrictions cannot be empty (no restrictions to check)',
    );
  }

  // Validate each menu item has a name
  for (const item of input.menuItems) {
    if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
      throw new Error('Each menu item must have a non-empty name');
    }
  }

  return true;
}

export function validateDCAOutput(output: DCAOutput): boolean {
  if (!output.results || !Array.isArray(output.results)) {
    throw new Error('results must be an array');
  }

  if (output.results.length === 0) {
    throw new Error('results cannot be empty');
  }

  if (!output.summary) {
    throw new Error('summary is required');
  }

  if (!output.recommendations || !Array.isArray(output.recommendations)) {
    throw new Error('recommendations must be an array');
  }

  // Validate compliance scores are between 0 and 1
  for (const result of output.results) {
    if (
      result.complianceScore < 0 ||
      result.complianceScore > 1 ||
      isNaN(result.complianceScore)
    ) {
      throw new Error('complianceScore must be between 0.0 and 1.0');
    }
  }

  // Validate summary counts
  const { totalDishes, compliantCount, nonCompliantCount, uncertainCount } =
    output.summary;

  if (totalDishes !== output.results.length) {
    throw new Error('summary.totalDishes must match results.length');
  }

  if (
    compliantCount + nonCompliantCount + uncertainCount !== totalDishes
  ) {
    throw new Error('Summary counts do not add up to totalDishes');
  }

  return true;
}
