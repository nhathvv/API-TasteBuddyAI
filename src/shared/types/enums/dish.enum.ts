/**
 * Base Dish Types for Vietnamese Cuisine
 * 
 * @description Categorizes Vietnamese dishes into common types
 */
export enum BaseDishType {
    NOODLE_SOUP = 'noodle_soup',
    RICE_PLATE = 'rice_plate',
    SALAD = 'salad',
    SPRING_ROLLS = 'spring_rolls',
    GRILLED_MEAT = 'grilled_meat',
    STIR_FRY = 'stir_fry',
    DESSERT = 'dessert',
    BEVERAGE = 'beverage',
    APPETIZER = 'appetizer',
    OTHER = 'other',
}

/**
 * Vietnamese Cuisine Regions
 * 
 * @description Identifies the regional style of Vietnamese dishes
 */
export enum CuisineRegion {
    NORTH_VIETNAM = 'north_vietnam',
    CENTRAL_VIETNAM = 'central_vietnam',
    SOUTH_VIETNAM = 'south_vietnam',
    FUSION = 'fusion',
    UNKNOWN = 'unknown',
}

/**
 * Ingredient Presence Estimation
 * 
 * @description Indicates how commonly an ingredient appears in a dish
 */
export enum EstimatedPresence {
    MANDATORY = 'mandatory', // Always included
    COMMON = 'common',       // Frequently included
    RARE = 'rare',           // Occasionally included
}
