/**
 * Job Queue Validators
 * 
 * Validation helpers for job results to ensure data quality
 */

import { JobMetadata, AllergenSummary, DishInfo, PriceAnalysis } from './job-queue.types';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate dish information
 */
export function validateDishInfo(dish: DishInfo): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!dish.name || dish.name.trim() === '') {
    errors.push('Dish name is required');
  }

  if (!dish.canonicalName || dish.canonicalName.trim() === '') {
    errors.push('Canonical name is required');
  }

  if (!dish.ingredients || dish.ingredients.trim() === '') {
    warnings.push(`Dish "${dish.name}" has no ingredients`);
  }

  // Price validation
  if (dish.price < 0) {
    errors.push(`Dish "${dish.name}" has negative price: ${dish.price}`);
  }

  if (dish.price === 0) {
    warnings.push(`Dish "${dish.name}" has zero price`);
  }

  // Reasonable price range (1,000 - 10,000,000 VND)
  if (dish.price > 0 && (dish.price < 1000 || dish.price > 10000000)) {
    warnings.push(`Dish "${dish.name}" has unusual price: ${dish.price}₫`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate allergen summary
 */
export function validateAllergenSummary(summary: AllergenSummary): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check counts
  if (summary.safeItems < 0) {
    errors.push('Safe items count cannot be negative');
  }

  if (summary.unsafeItems < 0) {
    errors.push('Unsafe items count cannot be negative');
  }

  const totalItems = summary.safeItems + summary.unsafeItems;
  if (totalItems === 0) {
    warnings.push('No items analyzed for allergens');
  }

  // Validate details match counts
  if (summary.details.length !== totalItems) {
    warnings.push(
      `Allergen details count (${summary.details.length}) doesn't match total items (${totalItems})`
    );
  }

  // Validate risk level consistency
  const safeCount = summary.details.filter(d => d.riskLevel === 'SAFE').length;
  const unsafeCount = summary.details.filter(d => d.riskLevel !== 'SAFE').length;

  if (safeCount !== summary.safeItems) {
    errors.push(
      `Safe items count mismatch: summary=${summary.safeItems}, actual=${safeCount}`
    );
  }

  if (unsafeCount !== summary.unsafeItems) {
    errors.push(
      `Unsafe items count mismatch: summary=${summary.unsafeItems}, actual=${unsafeCount}`
    );
  }

  // Validate overall risk
  if (summary.unsafeItems > 0 && summary.overallRisk === 'low') {
    warnings.push('Overall risk is "low" but there are unsafe items');
  }

  if (summary.unsafeItems === 0 && summary.overallRisk !== 'low') {
    warnings.push(`Overall risk is "${summary.overallRisk}" but all items are safe`);
  }

  // Validate each detail
  summary.details.forEach((detail, index) => {
    if (!detail.dishName || detail.dishName.trim() === '') {
      errors.push(`Allergen detail at index ${index} has no dish name`);
    }

    if (detail.riskLevel !== 'SAFE' && (!detail.allergens || detail.allergens.length === 0)) {
      warnings.push(
        `Dish "${detail.dishName}" marked as ${detail.riskLevel} but has no allergens listed`
      );
    }

    if (detail.riskLevel === 'SAFE' && detail.allergens && detail.allergens.length > 0) {
      warnings.push(
        `Dish "${detail.dishName}" marked as SAFE but has ${detail.allergens.length} allergens listed`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate price analysis
 */
export function validatePriceAnalysis(analysis: PriceAnalysis): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for negative values
  if (analysis.averagePrice < 0) {
    errors.push('Average price cannot be negative');
  }

  if (analysis.minPrice < 0) {
    errors.push('Min price cannot be negative');
  }

  if (analysis.maxPrice < 0) {
    errors.push('Max price cannot be negative');
  }

  if (analysis.dishCount < 0) {
    errors.push('Dish count cannot be negative');
  }

  // Logical consistency
  if (analysis.minPrice > analysis.maxPrice) {
    errors.push(
      `Min price (${analysis.minPrice}) is greater than max price (${analysis.maxPrice})`
    );
  }

  if (analysis.averagePrice < analysis.minPrice || analysis.averagePrice > analysis.maxPrice) {
    errors.push(
      `Average price (${analysis.averagePrice}) is outside min-max range (${analysis.minPrice}-${analysis.maxPrice})`
    );
  }

  // Warnings for unusual values
  if (analysis.dishCount === 0) {
    warnings.push('No dishes analyzed for pricing');
  }

  if (analysis.dishCount > 0 && analysis.averagePrice === 0) {
    warnings.push('Average price is zero despite having dishes');
  }

  // Check for unrealistic price ranges
  const priceRange = analysis.maxPrice - analysis.minPrice;
  if (priceRange > 5000000) {
    warnings.push(
      `Very large price range: ${priceRange.toLocaleString('vi-VN')}₫ (min: ${analysis.minPrice.toLocaleString('vi-VN')}₫, max: ${analysis.maxPrice.toLocaleString('vi-VN')}₫)`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate complete job metadata
 */
export function validateJobMetadata(metadata: JobMetadata): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate dishes
  if (metadata.dishes && metadata.dishes.length > 0) {
    metadata.dishes.forEach((dish, index) => {
      const result = validateDishInfo(dish);
      result.errors.forEach(err => allErrors.push(`Dish ${index + 1}: ${err}`));
      result.warnings.forEach(warn => allWarnings.push(`Dish ${index + 1}: ${warn}`));
    });
  } else {
    allWarnings.push('No dishes in metadata');
  }

  // Validate allergen summary
  if (metadata.allergenSummary) {
    const result = validateAllergenSummary(metadata.allergenSummary);
    result.errors.forEach(err => allErrors.push(`Allergen: ${err}`));
    result.warnings.forEach(warn => allWarnings.push(`Allergen: ${warn}`));
  }

  // Validate price analysis
  if (metadata.priceAnalysis) {
    const result = validatePriceAnalysis(metadata.priceAnalysis);
    result.errors.forEach(err => allErrors.push(`Price: ${err}`));
    result.warnings.forEach(warn => allWarnings.push(`Price: ${warn}`));

    // Cross-validate with dishes
    if (metadata.dishes && metadata.priceAnalysis.dishCount !== metadata.dishes.length) {
      allWarnings.push(
        `Price analysis dish count (${metadata.priceAnalysis.dishCount}) doesn't match actual dishes (${metadata.dishes.length})`
      );
    }
  }

  // Cross-validate allergen summary with dishes
  if (metadata.allergenSummary && metadata.dishes) {
    const totalAllergenDishes = metadata.allergenSummary.safeItems + metadata.allergenSummary.unsafeItems;
    if (totalAllergenDishes !== metadata.dishes.length) {
      allWarnings.push(
        `Allergen analysis count (${totalAllergenDishes}) doesn't match dishes count (${metadata.dishes.length})`
      );
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Check if validation result should trigger retry
 */
export function shouldRetryBasedOnValidation(result: ValidationResult): boolean {
  // Retry if there are critical errors
  const criticalErrors = result.errors.filter(err => 
    err.includes('required') ||
    err.includes('negative') ||
    err.includes('mismatch')
  );

  return criticalErrors.length > 0;
}

/**
 * Format validation result for logging
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.isValid) {
    lines.push('✅ Validation passed');
  } else {
    lines.push('❌ Validation failed');
  }

  if (result.errors.length > 0) {
    lines.push('\n🔴 Errors:');
    result.errors.forEach(err => lines.push(`  - ${err}`));
  }

  if (result.warnings.length > 0) {
    lines.push('\n⚠️  Warnings:');
    result.warnings.forEach(warn => lines.push(`  - ${warn}`));
  }

  return lines.join('\n');
}
