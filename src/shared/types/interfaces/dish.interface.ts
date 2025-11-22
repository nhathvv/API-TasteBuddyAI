/**
 * Ingredient Detail Interface
 * 
 * @description Detailed information about an ingredient in a dish
 */
export interface IIngredientDetail {
    /** Raw ingredient name as seen/inferred (e.g., "bò", "mắm ruốc") */
    name: string;

    /** Normalized canonical name in English (e.g., "beef", "fermented shrimp paste") */
    canonicalName: string;

    /** Is this a primary ingredient? */
    isPrimary: boolean;

    /** Is this optional/customizable? */
    isOptional: boolean;

    /** How common is this ingredient in the dish? */
    estimatedPresence: 'mandatory' | 'common' | 'rare';
}

/**
 * Dietary Profile Interface
 * 
 * @description Analysis of dietary compliance for a dish
 */
export interface IDietaryProfile {
    /** Likely vegetarian (no meat/fish) */
    isLikelyVegetarian: boolean;

    /** Likely vegan (no animal products) */
    isLikelyVegan: boolean;

    /** Likely gluten-free */
    isLikelyGlutenFree: boolean;

    /** Likely dairy-free */
    isLikelyDairyFree: boolean;

    /** Additional notes explaining the dietary profile */
    notes: string;
}

/**
 * Dish Item Input Interface
 * 
 * @description Input format from Visual Extraction Agent
 */
export interface IDishItem {
    /** Stable ID for this item */
    dishId: string;

    /** Raw dish name from menu (usually Vietnamese) */
    dishName: string;

    /** Optional short description from menu */
    description?: string | null;

    /** Menu section (e.g., "Món nước", "Cơm", "Đồ uống") */
    sectionName?: string | null;

    /** Optional region hint (e.g., "Hue", "Saigon", "Hanoi") */
    restaurantRegion?: string | null;

    /** Menu language code, default "vi" */
    language?: string | null;
}

/**
 * Dish Understanding Interface
 * 
 * @description Complete analysis result for a single dish
 */
export interface IDishUnderstanding {
    /** Unique dish identifier (from input) */
    dishId: string;

    /** Original menu name */
    originalName: string;

    /** Normalized canonical dish name */
    canonicalName: string;

    /** Alternative spellings/names (including English) */
    possibleAliases: string[];

    /** Detailed ingredient breakdown */
    ingredients: IIngredientDetail[];

    /** Cooking methods used (e.g., "boiled", "grilled", "deep-fried") */
    cookingMethods: string[];

    /** Base dish type category */
    baseDishType: string;

    /** Cuisine region */
    cuisineRegion: string;

    /** Dietary profile analysis */
    dietaryProfile: IDietaryProfile;

    /** Inferred allergen signals for downstream agents */
    inferredAllergenSignals: string[];

    /** Confidence in this analysis (0.0 - 1.0) */
    confidenceScore: number;

    /** Short reasoning summary (1-3 sentences) */
    reasoningSummary: string;
}
