import { SchemaType } from '@google/generative-ai';
import { MenuItem } from '../visual-extraction/visual-extraction.schema';

/**
 * Allergen Types
 *
 * Comprehensive list of major allergens according to FDA and international standards
 */
export type AllergenType =
  | 'peanuts'
  | 'tree-nuts'
  | 'shellfish'
  | 'fish'
  | 'eggs'
  | 'dairy'
  | 'soy'
  | 'wheat'
  | 'gluten'
  | 'sesame'
  | 'msg'
  | 'sulfites';

/**
 * Severity Levels for Allergen Reactions
 */
export type AllergenSeverity = 'mild' | 'moderate' | 'severe' | 'life-threatening';

/**
 * User Allergen Profile
 */
export interface UserAllergen {
  /** Type of allergen */
  type: AllergenType;

  /** Severity of user's reaction to this allergen */
  severity: AllergenSeverity;
}

/**
 * CSAA Input Schema
 */
export interface CSAAInput {
  /** Menu items from VEA to analyze */
  menuItems: MenuItem[];

  /** User's allergen profile */
  userAllergens: UserAllergen[];

  /** Strict mode: flag even trace amounts (default: true) */
  strictMode?: boolean;

  /** Language for output (default: 'en') */
  language?: string;
}

/**
 * Risk Level Classification
 */
export type RiskLevel =
  | 'SAFE'
  | 'LOW_RISK'
  | 'MEDIUM_RISK'
  | 'HIGH_RISK'
  | 'SEVERE_RISK'
  | 'UNKNOWN_RISK';

/**
 * Likelihood of Allergen Presence
 */
export type AllergenLikelihood = 'definite' | 'probable' | 'possible';

/**
 * Identified Allergen in Dish
 */
export interface IdentifiedAllergen {
  /** Allergen type detected */
  allergen: AllergenType;

  /** Source of allergen (e.g., "Mắm Tôm in broth", "Peanuts in sauce") */
  source: string;

  /** Likelihood of presence */
  likelihood: AllergenLikelihood;

  /** Severity impact for user */
  severity: AllergenSeverity;
}

/**
 * Dish Analysis Result
 */
export interface DishAnalysis {
  /** Name of the dish analyzed */
  dishName: string;

  /** Overall risk level for this dish */
  riskLevel: RiskLevel;

  /** List of allergens detected */
  identifiedAllergens: IdentifiedAllergen[];

  /** Chain-of-thought reasoning explaining the risk assessment */
  reasoning: string;

  /** Confidence score for this analysis (0.0 - 1.0) */
  confidenceScore: number;

  /** Recommendations for user (if any) */
  recommendations?: string[];

  /** Alternative dishes that might be safe (if unsafe) */
  alternativeDishes?: string[];
}

/**
 * Analysis Summary
 */
export interface AnalysisSummary {
  /** Number of safe dishes */
  safeItems: number;

  /** Number of dishes with warnings */
  warningItems: number;

  /** Number of unsafe dishes */
  unsafeItems: number;

  /** Overall risk level across all dishes */
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * CSAA Output Schema
 */
export interface CSAAOutput {
  /** Individual dish analyses */
  analysis: DishAnalysis[];

  /** Summary statistics */
  summary: AnalysisSummary;
}

/**
 * Gemini JSON Schema for Allergen Analysis
 */
export const ALLERGEN_ANALYSIS_SCHEMA = {
  description: 'Vietnamese cuisine allergen safety analysis',
  type: SchemaType.OBJECT,
  properties: {
    analysis: {
      type: SchemaType.ARRAY,
      description: 'Analysis results for each dish',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dishName: {
            type: SchemaType.STRING,
            description: 'Name of the dish',
          },
          riskLevel: {
            type: SchemaType.STRING,
            description: 'Risk level classification',
            enum: [
              'SAFE',
              'LOW_RISK',
              'MEDIUM_RISK',
              'HIGH_RISK',
              'SEVERE_RISK',
              'UNKNOWN_RISK',
            ],
          },
          identifiedAllergens: {
            type: SchemaType.ARRAY,
            description: 'List of detected allergens',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                allergen: {
                  type: SchemaType.STRING,
                  description: 'Type of allergen',
                },
                source: {
                  type: SchemaType.STRING,
                  description:
                    'Source/location of allergen in dish (e.g., "Mắm Tôm in broth")',
                },
                likelihood: {
                  type: SchemaType.STRING,
                  description: 'Likelihood of allergen presence',
                  enum: ['definite', 'probable', 'possible'],
                },
                severity: {
                  type: SchemaType.STRING,
                  description: 'Severity impact',
                  enum: ['mild', 'moderate', 'severe', 'life-threatening'],
                },
              },
              required: ['allergen', 'source', 'likelihood', 'severity'],
            },
          },
          reasoning: {
            type: SchemaType.STRING,
            description:
              'Chain-of-thought explanation for risk assessment (2-4 sentences)',
          },
          confidenceScore: {
            type: SchemaType.NUMBER,
            description: 'Confidence in analysis (0.0 to 1.0)',
          },
          recommendations: {
            type: SchemaType.ARRAY,
            description: 'Safety recommendations',
            items: {
              type: SchemaType.STRING,
            },
            nullable: true,
          },
          alternativeDishes: {
            type: SchemaType.ARRAY,
            description: 'Suggested safe alternatives',
            items: {
              type: SchemaType.STRING,
            },
            nullable: true,
          },
        },
        required: [
          'dishName',
          'riskLevel',
          'identifiedAllergens',
          'reasoning',
          'confidenceScore',
        ],
      },
    },
    summary: {
      type: SchemaType.OBJECT,
      description: 'Summary of overall analysis',
      properties: {
        safeItems: {
          type: SchemaType.NUMBER,
          description: 'Count of safe dishes',
        },
        warningItems: {
          type: SchemaType.NUMBER,
          description: 'Count of dishes with warnings',
        },
        unsafeItems: {
          type: SchemaType.NUMBER,
          description: 'Count of unsafe dishes',
        },
        overallRisk: {
          type: SchemaType.STRING,
          description: 'Overall risk across all dishes',
          enum: ['low', 'medium', 'high', 'critical'],
        },
      },
      required: ['safeItems', 'warningItems', 'unsafeItems', 'overallRisk'],
    },
  },
  required: ['analysis', 'summary'],
};

/**
 * Validation functions
 */

export function validateCSAAInput(input: CSAAInput): boolean {
  if (!input.menuItems || !Array.isArray(input.menuItems)) {
    throw new Error('menuItems must be an array');
  }

  if (input.menuItems.length === 0) {
    throw new Error('menuItems cannot be empty');
  }

  if (!input.userAllergens || !Array.isArray(input.userAllergens)) {
    throw new Error('userAllergens must be an array');
  }

  if (input.userAllergens.length === 0) {
    throw new Error('userAllergens cannot be empty (no allergens to check)');
  }

  return true;
}

export function validateCSAAOutput(output: CSAAOutput): boolean {
  if (!output.analysis || !Array.isArray(output.analysis)) {
    throw new Error('analysis must be an array');
  }

  if (!output.summary) {
    throw new Error('summary is required');
  }

  // Validate summary counts
  const { safeItems, warningItems, unsafeItems } = output.summary;
  const totalCounted = safeItems + warningItems + unsafeItems;

  if (totalCounted !== output.analysis.length) {
    throw new Error(
      `Summary counts (${totalCounted}) don't match analysis length (${output.analysis.length})`,
    );
  }

  return true;
}
