import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { BaseAIAgent } from '../base/base-agent.abstract';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';
import {
  CloudVisionInput,
  CloudVisionOutput,
  VisionFeature,
  validateCloudVisionInput,
  TextAnnotation,
  LabelAnnotation,
  ObjectAnnotation,
  LogoAnnotation,
} from './cloud-vision.schema';

/**
 * Cloud Vision Agent
 *
 * Specialized agent for advanced image analysis using Google Cloud Vision API.
 * Provides OCR, label detection, object detection, logo detection, and more.
 *
 * This agent complements the Visual Extraction Agent (Gemini-based) by offering:
 * - More accurate OCR with language detection
 * - Object localization with bounding boxes
 * - Label detection for image classification
 * - Logo detection for brand recognition
 *
 * Model: Google Cloud Vision API v1
 *
 * Capabilities:
 * - TEXT_DETECTION: Extract printed and handwritten text
 * - LABEL_DETECTION: Identify objects, concepts, and categories
 * - OBJECT_LOCALIZATION: Detect and locate objects with bounding boxes
 * - LOGO_DETECTION: Recognize brand logos
 * - DOCUMENT_TEXT_DETECTION: OCR optimized for documents
 *
 * @extends {BaseAIAgent<CloudVisionInput, CloudVisionOutput>}
 */
@Injectable()
export class CloudVisionAgent extends BaseAIAgent<
  CloudVisionInput,
  CloudVisionOutput
> {
  private visionClient: ImageAnnotatorClient;

  constructor(
    geminiService: GeminiCoreService,
    private configService: ConfigService,
  ) {
    super(geminiService, {
      name: 'CloudVisionAgent',
      modelType: 'pro', // Not used, but required by base class
      timeout: 30000, // 30 seconds for Cloud Vision API
      cacheable: false,
      systemInstruction: 'Cloud Vision API Agent for advanced image analysis',
    });

    // Initialize Cloud Vision client
    const apiKey = this.configService.get<string>('GOOGLE_CLOUD_VISION_API_KEY');
    const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    
    if (!apiKey && !credentialsPath) {
      this.logger.warn(
        'Neither GOOGLE_CLOUD_VISION_API_KEY nor GOOGLE_APPLICATION_CREDENTIALS found. Cloud Vision Agent will not work.',
      );
      this.logger.warn(
        'Please set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account JSON file path.',
      );
    }

    // Initialize with credentials (prefer service account over API key)
    if (credentialsPath) {
      this.logger.log('Initializing Cloud Vision with service account credentials');
      this.visionClient = new ImageAnnotatorClient({
        keyFilename: credentialsPath,
      });
    } else if (apiKey) {
      this.logger.log('Initializing Cloud Vision with API key');
      this.visionClient = new ImageAnnotatorClient({
        apiKey: apiKey,
      });
    } else {
      // Fallback to default credentials (ADC)
      this.logger.log('Initializing Cloud Vision with default credentials');
      this.visionClient = new ImageAnnotatorClient();
    }

    this.logger.log('Cloud Vision Agent initialized');
  }

  /**
   * Validate Cloud Vision input
   *
   * @param input - Input to validate
   * @returns True if valid, false otherwise
   */
  validate(input: CloudVisionInput): boolean {
    try {
      validateCloudVisionInput(input);
      return true;
    } catch (error) {
      this.logger.error(`Input validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Process image using Cloud Vision API
   *
   * @param input - CloudVisionInput with image data and feature requests
   * @returns Promise<CloudVisionOutput> with detected features
   */
  protected async process(
    input: CloudVisionInput,
  ): Promise<CloudVisionOutput> {
    const startTime = Date.now();

    // Sanitize Base64 (remove data URI prefix if present)
    const cleanBase64 = this.geminiService.sanitizeBase64(input.imageData);

    // Default features if not specified
    const features = input.features || [
      VisionFeature.TEXT_DETECTION,
      VisionFeature.LABEL_DETECTION,
    ];

    const maxResults = input.maxResults || 10;

    this.logger.log(
      `Analyzing image with features: ${features.join(', ')}`,
    );

    try {
      // Build request
      const request = {
        image: {
          content: cleanBase64,
        },
        features: features.map((feature) => ({
          type: feature,
          maxResults: maxResults,
        })),
        imageContext: input.languageHints
          ? {
              languageHints: input.languageHints,
            }
          : undefined,
      };

      // Call Cloud Vision API
      const [result] = await this.visionClient.annotateImage(request);

      // Extract results
      const output: CloudVisionOutput = {
        metadata: {
          processingTime: 0, // Will be set below
          confidenceScore: 0, // Will be calculated
          featuresRequested: features.length,
          featuresCompleted: [],
        },
      };

      // Process TEXT_DETECTION results
      if (features.includes(VisionFeature.TEXT_DETECTION) || 
          features.includes(VisionFeature.DOCUMENT_TEXT_DETECTION)) {
        if (result.textAnnotations && result.textAnnotations.length > 0) {
          // First annotation is the full text
          output.fullText = result.textAnnotations[0].description || '';

          // Map text annotations
          output.textAnnotations = result.textAnnotations.slice(1).map(
            (annotation): TextAnnotation => ({
              description: annotation.description || '',
              confidence: annotation.confidence ?? undefined,
              boundingPoly: annotation.boundingPoly
                ? {
                    vertices: annotation.boundingPoly.vertices?.map((v) => ({
                      x: v.x || 0,
                      y: v.y || 0,
                    })) || [],
                  }
                : undefined,
              locale: annotation.locale ?? undefined,
            }),
          );

          output.metadata.featuresCompleted.push('TEXT_DETECTION');
        }
      }

      // Process LABEL_DETECTION results
      if (features.includes(VisionFeature.LABEL_DETECTION)) {
        if (result.labelAnnotations && result.labelAnnotations.length > 0) {
          output.labelAnnotations = result.labelAnnotations.map(
            (annotation): LabelAnnotation => ({
              description: annotation.description || '',
              score: annotation.score || 0,
              topicality: annotation.topicality ?? undefined,
            }),
          );

          output.metadata.featuresCompleted.push('LABEL_DETECTION');
        }
      }

      // Process OBJECT_LOCALIZATION results
      if (features.includes(VisionFeature.OBJECT_LOCALIZATION)) {
        if (
          result.localizedObjectAnnotations &&
          result.localizedObjectAnnotations.length > 0
        ) {
          output.objectAnnotations = result.localizedObjectAnnotations.map(
            (annotation): ObjectAnnotation => ({
              name: annotation.name || '',
              score: annotation.score || 0,
              boundingPoly: annotation.boundingPoly
                ? {
                    vertices:
                      annotation.boundingPoly.normalizedVertices?.map((v) => ({
                        x: v.x || 0,
                        y: v.y || 0,
                      })) || [],
                  }
                : undefined,
            }),
          );

          output.metadata.featuresCompleted.push('OBJECT_LOCALIZATION');
        }
      }

      // Process LOGO_DETECTION results
      if (features.includes(VisionFeature.LOGO_DETECTION)) {
        if (result.logoAnnotations && result.logoAnnotations.length > 0) {
          output.logoAnnotations = result.logoAnnotations.map(
            (annotation): LogoAnnotation => ({
              description: annotation.description || '',
              score: annotation.score || 0,
              boundingPoly: annotation.boundingPoly
                ? {
                    vertices: annotation.boundingPoly.vertices?.map((v) => ({
                      x: v.x || 0,
                      y: v.y || 0,
                    })) || [],
                  }
                : undefined,
            }),
          );

          output.metadata.featuresCompleted.push('LOGO_DETECTION');
        }
      }

      // Calculate overall confidence score (average of all scores)
      const allScores: number[] = [];

      if (output.labelAnnotations) {
        allScores.push(...output.labelAnnotations.map((l) => l.score));
      }
      if (output.objectAnnotations) {
        allScores.push(...output.objectAnnotations.map((o) => o.score));
      }
      if (output.logoAnnotations) {
        allScores.push(...output.logoAnnotations.map((l) => l.score));
      }

      output.metadata.confidenceScore =
        allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : 0.5;

      // Set processing time
      output.metadata.processingTime = Date.now() - startTime;

      this.logger.log(
        `Cloud Vision analysis completed in ${output.metadata.processingTime}ms with ${output.metadata.featuresCompleted.length} features`,
      );

      return output;
    } catch (error) {
      this.logger.error(`Cloud Vision API failed: ${error.message}`);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  /**
   * Validate output
   *
   * @param output - CloudVisionOutput to validate
   * @returns True if valid
   */
  protected validateOutput(output: CloudVisionOutput): boolean {
    if (!output || !output.metadata) {
      this.logger.error('Output is missing metadata');
      return false;
    }

    // Warn if no features completed
    if (output.metadata.featuresCompleted.length === 0) {
      this.logger.warn('No features were successfully analyzed');
    }

    return true;
  }

  /**
   * Handle errors specific to Cloud Vision Agent
   *
   * @param error - Original error
   * @returns Transformed error
   */
  protected handleError(error: Error): Error {
    const errorMsg = error.message;

    if (errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('API has not been enabled')) {
      return new Error(
        `CLOUD_VISION_AUTH_ERROR: Permission denied. Please:
1. Enable Cloud Vision API in Google Cloud Console
2. Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file path
3. Ensure the service account has 'Cloud Vision API User' role

Original error: ${errorMsg}`,
      );
    }

    if (errorMsg.includes('API key')) {
      return new Error(
        `CLOUD_VISION_AUTH_ERROR: ${errorMsg}. 
Note: Cloud Vision API requires service account credentials.
Set GOOGLE_APPLICATION_CREDENTIALS environment variable.`,
      );
    }

    if (errorMsg.includes('quota')) {
      return new Error(
        'CLOUD_VISION_QUOTA_ERROR: API quota exceeded. Try again later.',
      );
    }

    if (errorMsg.includes('timeout')) {
      return new Error(
        'CLOUD_VISION_TIMEOUT: Analysis took too long. Try a smaller image.',
      );
    }

    // Default error handling
    return new Error(`CLOUD_VISION_ERROR: ${errorMsg}`);
  }
}
