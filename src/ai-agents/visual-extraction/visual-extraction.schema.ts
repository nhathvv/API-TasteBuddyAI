import { SchemaType } from '@google/generative-ai';

/**
 * Visual Extraction Agent Input Schema
 */
export interface VEAInput {
  /** Base64 encoded image data (without data URI prefix) */
  imageData: string;

  /** MIME type of the image */
  mimeType: string;

  /** Language for extraction (default: 'vi') */
  language?: string;

  /** Extraction mode: 'full' or 'quick' */
  extractionMode?: 'full' | 'quick';
}

/**
 * Menu Section Structure
 */
export interface MenuSection {
  /** Section name (e.g., "Món Nước", "Cơm Đĩa") */
  sectionName: string;

  /** Items in this section */
  items: MenuItem[];
}

/**
 * Menu Item Structure
 */
export interface MenuItem {
  /** Dish name in original language (preserve Vietnamese diacritics) */
  name: string;

  /** Description or ingredients (if available) */
  description?: string;

  /** Price in VND (normalized to integer) */
  price: number;

  /** Category/type of dish */
  category?: string;

  /** Visual tags detected (e.g., "spicy-icon", "vegetarian-leaf") */
  visualTags?: string[];

  /** Position on menu (for menu engineering) */
  position?: {
    x: number;
    y: number;
  };
}

/**
 * Extraction Quality Level
 */
export type ExtractionQuality = 'high' | 'medium' | 'low';

/**
 * Visual Extraction Agent Output Schema
 */
export interface VEAOutput {
  /** Restaurant name (if detected) */
  restaurantName?: string;

  /** Extracted menu sections */
  menuSections: MenuSection[];

  /** Extraction metadata */
  metadata: {
    /** Total number of items extracted */
    totalItems: number;

    /** Quality of extraction */
    extractionQuality: ExtractionQuality;

    /** Confidence score (0.0 - 1.0) */
    confidenceScore: number;

    /** Processing time in milliseconds */
    processingTime: number;
  };
}

/**
 * Gemini JSON Schema for Menu Extraction
 *
 * This schema is used to enforce structured JSON output from Gemini
 */
export const MENU_EXTRACTION_SCHEMA = {
  description: 'Vietnamese menu extraction structure',
  type: SchemaType.OBJECT,
  properties: {
    restaurantName: {
      type: SchemaType.STRING,
      description: 'Restaurant name if visible on menu',
      nullable: true,
    },
    menuSections: {
      type: SchemaType.ARRAY,
      description: 'Array of menu sections',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          sectionName: {
            type: SchemaType.STRING,
            description:
              'Section header (e.g., "Món Nước", "Khai Vị", "Món Chính")',
          },
          items: {
            type: SchemaType.ARRAY,
            description: 'Menu items in this section',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: {
                  type: SchemaType.STRING,
                  description:
                    'Dish name in Vietnamese (preserve all diacritics)',
                },
                description: {
                  type: SchemaType.STRING,
                  description: 'Description or ingredients if available',
                  nullable: true,
                },
                price: {
                  type: SchemaType.NUMBER,
                  description:
                    'Price as integer in VND (convert "50k" to 50000)',
                },
                category: {
                  type: SchemaType.STRING,
                  description: 'Category or type of dish',
                  nullable: true,
                },
                visualTags: {
                  type: SchemaType.ARRAY,
                  description: 'Visual indicators (spicy, vegetarian, etc.)',
                  items: {
                    type: SchemaType.STRING,
                  },
                  nullable: true,
                },
              },
              required: ['name', 'price'],
            },
          },
        },
        required: ['sectionName', 'items'],
      },
    },
    metadata: {
      type: SchemaType.OBJECT,
      properties: {
        totalItems: {
          type: SchemaType.NUMBER,
          description: 'Total number of menu items extracted',
        },
        extractionQuality: {
          type: SchemaType.STRING,
          description: 'Quality assessment of extraction',
          enum: ['high', 'medium', 'low'],
        },
        confidenceScore: {
          type: SchemaType.NUMBER,
          description: 'Confidence score between 0.0 and 1.0',
        },
      },
      required: ['totalItems', 'extractionQuality', 'confidenceScore'],
    },
  },
  required: ['menuSections', 'metadata'],
};

/**
 * Validation functions
 */

export function validateVEAInput(input: VEAInput): boolean {
  if (!input.imageData || typeof input.imageData !== 'string') {
    throw new Error('imageData is required and must be a string');
  }

  if (!input.mimeType || typeof input.mimeType !== 'string') {
    throw new Error('mimeType is required and must be a string');
  }

  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!validMimeTypes.includes(input.mimeType.toLowerCase())) {
    throw new Error(
      `Invalid mimeType. Must be one of: ${validMimeTypes.join(', ')}`,
    );
  }

  return true;
}

export function validateVEAOutput(output: VEAOutput): boolean {
  if (!output.menuSections || !Array.isArray(output.menuSections)) {
    throw new Error('menuSections must be an array');
  }

  if (!output.metadata) {
    throw new Error('metadata is required');
  }

  const { confidenceScore, extractionQuality } = output.metadata;

  if (
    typeof confidenceScore !== 'number' ||
    confidenceScore < 0 ||
    confidenceScore > 1
  ) {
    throw new Error('confidenceScore must be between 0 and 1');
  }

  const validQualities: ExtractionQuality[] = ['high', 'medium', 'low'];
  if (!validQualities.includes(extractionQuality)) {
    throw new Error(
      `extractionQuality must be one of: ${validQualities.join(', ')}`,
    );
  }

  return true;
}
