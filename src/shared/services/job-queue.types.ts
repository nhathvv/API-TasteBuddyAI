/**
 * Job Queue Types
 * 
 * Type definitions for job metadata and analysis results
 */

/**
 * Risk level for allergen analysis
 */
export type RiskLevel = 'SAFE' | 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'SEVERE_RISK';

/**
 * Overall risk assessment
 */
export type OverallRisk = 'low' | 'medium' | 'moderate' | 'high' | 'severe';

/**
 * Allergen likelihood
 */
export type AllergenLikelihood = 'low' | 'medium' | 'high' | 'certain';

/**
 * Allergen severity
 */
export type AllergenSeverity = 'mild' | 'moderate' | 'severe' | 'life-threatening';

/**
 * Individual allergen information
 */
export interface AllergenInfo {
  /** Type of allergen (e.g., 'shellfish', 'peanuts', 'dairy') */
  type: string;
  
  /** Source ingredient containing the allergen */
  source: string;
  
  /** Likelihood of allergen presence */
  likelihood: AllergenLikelihood;
  
  /** Severity of allergic reaction */
  severity: AllergenSeverity;
  
  /** Additional notes or warnings */
  notes?: string;
}

/**
 * Allergen analysis for a single dish
 */
export interface DishAllergenDetail {
  /** Name of the dish */
  dishName: string;
  
  /** Risk level for this dish */
  riskLevel: RiskLevel;
  
  /** List of allergens found in this dish */
  allergens: AllergenInfo[];
  
  /** Safe alternatives or recommendations */
  recommendations?: string[];
}

/**
 * Summary of allergen analysis across all dishes
 */
export interface AllergenSummary {
  /** Number of safe dishes */
  safeItems: number;
  
  /** Number of unsafe dishes */
  unsafeItems: number;
  
  /** Overall risk level */
  overallRisk: OverallRisk;
  
  /** Detailed analysis per dish */
  details: DishAllergenDetail[];
  
  /** List of all allergen types found */
  allergenTypes?: string[];
  
  /** General recommendations */
  generalRecommendations?: string[];
}

/**
 * Dish information
 */
export interface DishInfo {
  /** Display name of the dish */
  name: string;
  
  /** Canonical/standardized name */
  canonicalName: string;
  
  /** Ingredients list */
  ingredients: string;
  
  /** Price in VND */
  price: number;
  
  /** Description */
  description?: string;
  
  /** Category */
  category?: string;
}

/**
 * Price analysis results
 */
export interface PriceAnalysis {
  /** Average price across all dishes */
  averagePrice: number;
  
  /** Minimum price */
  minPrice: number;
  
  /** Maximum price */
  maxPrice: number;
  
  /** Total number of dishes analyzed */
  dishCount: number;
  
  /** Price distribution by category */
  priceByCategory?: Record<string, {
    average: number;
    min: number;
    max: number;
    count: number;
  }>;
}

/**
 * Nutrition information
 */
export interface NutritionInfo {
  /** Calories per serving */
  calories?: number;
  
  /** Protein in grams */
  protein?: number;
  
  /** Carbohydrates in grams */
  carbs?: number;
  
  /** Fat in grams */
  fat?: number;
  
  /** Fiber in grams */
  fiber?: number;
  
  /** Sodium in mg */
  sodium?: number;
}

/**
 * Dietary information
 */
export interface DietaryInfo {
  /** Is vegetarian */
  isVegetarian: boolean;
  
  /** Is vegan */
  isVegan: boolean;
  
  /** Is gluten-free */
  isGlutenFree: boolean;
  
  /** Is halal */
  isHalal: boolean;
  
  /** Is kosher */
  isKosher: boolean;
  
  /** Additional dietary tags */
  tags?: string[];
}

/**
 * Complete job metadata for logging and analysis
 */
export interface JobMetadata {
  /** List of dishes analyzed */
  dishes?: DishInfo[];
  
  /** Allergen analysis summary */
  allergenSummary?: AllergenSummary;
  
  /** Price analysis */
  priceAnalysis?: PriceAnalysis;
  
  /** Nutrition information */
  nutritionInfo?: NutritionInfo;
  
  /** Dietary information */
  dietaryInfo?: DietaryInfo;
  
  /** Additional custom metadata */
  [key: string]: any;
}

/**
 * Job error types
 */
export enum JobErrorType {
  /** Job not found in queue */
  NOT_FOUND = 'JOB_NOT_FOUND',
  
  /** Job already completed */
  ALREADY_COMPLETED = 'JOB_ALREADY_COMPLETED',
  
  /** Job already failed */
  ALREADY_FAILED = 'JOB_ALREADY_FAILED',
  
  /** Stage processing failed */
  STAGE_FAILED = 'STAGE_FAILED',
  
  /** Job timeout */
  TIMEOUT = 'JOB_TIMEOUT',
  
  /** Invalid stage transition */
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  
  /** Maximum retries exceeded */
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',
}

/**
 * Job error with additional context
 */
export interface JobError {
  /** Error type */
  type: JobErrorType;
  
  /** Error message */
  message: string;
  
  /** Stage where error occurred */
  stage?: string;
  
  /** Original error */
  originalError?: Error;
  
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Stage configuration
 */
export interface StageConfig {
  /** Maximum number of retries for this stage */
  maxRetries?: number;
  
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  
  /** Timeout for this stage in milliseconds */
  timeout?: number;
  
  /** Whether this stage is required */
  required?: boolean;
}

/**
 * Job configuration
 */
export interface JobConfig {
  /** Job timeout in milliseconds */
  timeout?: number;
  
  /** Stage-specific configurations */
  stageConfigs?: Record<string, StageConfig>;
  
  /** Enable detailed logging */
  enableDetailedLogging?: boolean;
  
  /** Custom metadata */
  metadata?: Record<string, any>;
}
