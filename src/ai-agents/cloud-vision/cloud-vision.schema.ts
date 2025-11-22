/**
 * Cloud Vision AI Agent Schema
 *
 * Defines input/output types and validation for Google Cloud Vision Agent
 */

/**
 * Vision Feature Types
 * @see https://cloud.google.com/vision/docs/reference/rest/v1/Feature
 */
export enum VisionFeature {
  /** Optical Character Recognition */
  TEXT_DETECTION = 'TEXT_DETECTION',
  /** Document Text Detection (denser text) */
  DOCUMENT_TEXT_DETECTION = 'DOCUMENT_TEXT_DETECTION',
  /** Label Detection (tags/categories) */
  LABEL_DETECTION = 'LABEL_DETECTION',
  /** Object Localization */
  OBJECT_LOCALIZATION = 'OBJECT_LOCALIZATION',
  /** Logo Detection */
  LOGO_DETECTION = 'LOGO_DETECTION',
  /** Landmark Detection */
  LANDMARK_DETECTION = 'LANDMARK_DETECTION',
  /** Face Detection */
  FACE_DETECTION = 'FACE_DETECTION',
  /** Image Properties (colors) */
  IMAGE_PROPERTIES = 'IMAGE_PROPERTIES',
  /** Safe Search Detection */
  SAFE_SEARCH_DETECTION = 'SAFE_SEARCH_DETECTION',
}

/**
 * Cloud Vision Agent Input
 */
export interface CloudVisionInput {
  /** Base64 encoded image data (without data URI prefix) */
  imageData: string;

  /** MIME type of the image */
  mimeType: string;

  /** Features to detect (default: TEXT_DETECTION + LABEL_DETECTION) */
  features?: VisionFeature[];

  /** Maximum results per feature (default: 10) */
  maxResults?: number;

  /** Language hints for text detection (e.g., ['vi', 'en']) */
  languageHints?: string[];
}

/**
 * Bounding Box (Polygon)
 */
export interface BoundingPoly {
  vertices: Array<{ x: number; y: number }>;
}

/**
 * Text Annotation from Vision API
 */
export interface TextAnnotation {
  /** Detected text */
  description: string;

  /** Confidence score (0.0 - 1.0) */
  confidence?: number;

  /** Bounding polygon */
  boundingPoly?: BoundingPoly;

  /** Language code detected */
  locale?: string;
}

/**
 * Label Annotation (tags/categories)
 */
export interface LabelAnnotation {
  /** Label description */
  description: string;

  /** Confidence score (0.0 - 1.0) */
  score: number;

  /** Topicality score (relevance) */
  topicality?: number;
}

/**
 * Object Annotation
 */
export interface ObjectAnnotation {
  /** Object name */
  name: string;

  /** Confidence score (0.0 - 1.0) */
  score: number;

  /** Bounding polygon */
  boundingPoly?: BoundingPoly;
}

/**
 * Logo Annotation
 */
export interface LogoAnnotation {
  /** Logo description */
  description: string;

  /** Confidence score (0.0 - 1.0) */
  score: number;

  /** Bounding polygon */
  boundingPoly?: BoundingPoly;
}

/**
 * Cloud Vision Agent Output
 */
export interface CloudVisionOutput {
  /** Full text detected (if TEXT_DETECTION enabled) */
  fullText?: string;

  /** Individual text annotations */
  textAnnotations?: TextAnnotation[];

  /** Label detections (tags/categories) */
  labelAnnotations?: LabelAnnotation[];

  /** Object detections */
  objectAnnotations?: ObjectAnnotation[];

  /** Logo detections */
  logoAnnotations?: LogoAnnotation[];

  /** Processing metadata */
  metadata: {
    /** Processing time in milliseconds */
    processingTime: number;

    /** Overall confidence score */
    confidenceScore: number;

    /** Number of features requested */
    featuresRequested: number;

    /** Features that succeeded */
    featuresCompleted: string[];
  };
}

/**
 * Validation Functions
 */

export function validateCloudVisionInput(input: CloudVisionInput): boolean {
  if (!input.imageData || typeof input.imageData !== 'string') {
    throw new Error('imageData is required and must be a string');
  }

  if (!input.mimeType || typeof input.mimeType !== 'string') {
    throw new Error('mimeType is required and must be a string');
  }

  const validMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/x-icon',
  ];
  if (!validMimeTypes.includes(input.mimeType.toLowerCase())) {
    throw new Error(
      `Invalid mimeType. Must be one of: ${validMimeTypes.join(', ')}`,
    );
  }

  // Validate features if provided
  if (input.features && input.features.length > 0) {
    const validFeatures = Object.values(VisionFeature);
    for (const feature of input.features) {
      if (!validFeatures.includes(feature)) {
        throw new Error(
          `Invalid feature: ${feature}. Must be one of: ${validFeatures.join(', ')}`,
        );
      }
    }
  }

  return true;
}

export function validateCloudVisionOutput(
  output: CloudVisionOutput,
): boolean {
  if (!output.metadata) {
    throw new Error('metadata is required');
  }

  const { confidenceScore, processingTime } = output.metadata;

  if (
    typeof confidenceScore !== 'number' ||
    confidenceScore < 0 ||
    confidenceScore > 1
  ) {
    throw new Error('confidenceScore must be between 0 and 1');
  }

  if (typeof processingTime !== 'number' || processingTime < 0) {
    throw new Error('processingTime must be a positive number');
  }

  return true;
}
