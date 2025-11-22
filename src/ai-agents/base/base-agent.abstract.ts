import { Logger } from '@nestjs/common';
import { IAIAgent, AgentConfig } from './base-agent.interface';
import { GeminiCoreService } from '@/shared/services/gemini-core.service';

/**
 * Base AI Agent Abstract Class
 *
 * Implements common functionality for all AI agents following the Template Method pattern.
 * Concrete agents extend this class and implement the abstract methods.
 *
 * Benefits:
 * - Consistent error handling
 * - Standardized logging
 * - Validation pipeline
 * - Performance monitoring
 * - Open/Closed Principle (OCP) compliance
 *
 * @template TInput - The input type for the agent
 * @template TOutput - The output type for the agent
 */
export abstract class BaseAIAgent<TInput, TOutput>
  implements IAIAgent<TInput, TOutput>
{
  protected readonly logger: Logger;
  protected readonly config: AgentConfig;

  constructor(
    protected readonly geminiService: GeminiCoreService,
    config: Partial<AgentConfig> = {},
  ) {
    // Merge with default config
    this.config = {
      name: this.constructor.name,
      modelType: 'pro',
      timeout: 30000, // 30 seconds default
      cacheable: false,
      cacheTTL: 3600, // 1 hour default
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      ...config,
    };

    this.logger = new Logger(this.config.name);
  }

  /**
   * Template Method: Execute agent with validation and error handling
   *
   * This method cannot be overridden (final method in TypeScript terms)
   * Concrete agents implement the `process` method instead.
   *
   * @param input - Typed input data
   * @returns Promise resolving to typed output
   * @throws {ValidationException} If validation fails
   * @throws {AgentExecutionException} If execution fails
   */
  async execute(input: TInput): Promise<TOutput> {
    const startTime = Date.now();

    this.logger.log(`Executing ${this.config.name}`);
    this.logger.debug(`Input: ${JSON.stringify(input).substring(0, 200)}...`);

    try {
      // Step 1: Validate input
      if (!this.validate(input)) {
        throw new Error('Input validation failed');
      }

      // Step 2: Execute with timeout
      const result = await this.executeWithTimeout(
        this.process(input),
        this.config.timeout,
      );

      // Step 3: Validate output
      if (!this.validateOutput(result)) {
        throw new Error('Output validation failed');
      }

      const duration = Date.now() - startTime;
      this.logger.log(`${this.config.name} completed in ${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `${this.config.name} failed after ${duration}ms: ${error.message}`,
        error.stack,
      );

      throw this.handleError(error);
    }
  }

  /**
   * Validate input data
   *
   * Concrete agents must implement this method to validate their specific input type
   *
   * @param input - Input to validate
   * @returns True if valid, false otherwise
   */
  abstract validate(input: TInput): boolean;

  /**
   * Process the input and generate output
   *
   * Core business logic of the agent. Concrete agents implement this method.
   *
   * @param input - Validated input data
   * @returns Promise resolving to output
   */
  protected abstract process(input: TInput): Promise<TOutput>;

  /**
   * Validate output data (optional, default: always true)
   *
   * Override this in concrete agents if output validation is needed
   *
   * @param output - Output to validate
   * @returns True if valid, false otherwise
   */
  protected validateOutput(output: TOutput): boolean {
    // Default: assume output is always valid
    // Override in concrete agents for specific validation
    return output !== null && output !== undefined;
  }

  /**
   * Handle errors and transform them into meaningful exceptions
   *
   * Override this in concrete agents for custom error handling
   *
   * @param error - Original error
   * @returns Transformed error
   */
  protected handleError(error: Error): Error {
    // Default: return original error
    // Override for custom error transformation
    return error;
  }

  /**
   * Execute a promise with timeout
   *
   * @param promise - Promise to execute
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise result or timeout error
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Agent timeout after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  }

  /**
   * Get agent configuration
   *
   * @returns Agent configuration object
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Create a Gemini model instance based on agent config
   *
   * @returns Configured Gemini model
   */
  protected getModel() {
    const modelGetter =
      this.config.modelType === 'flash'
        ? this.geminiService.getFlashModel
        : this.geminiService.getProModel;

    return modelGetter.call(this.geminiService, {
      systemInstruction: this.config.systemInstruction,
    });
  }

  /**
   * Build generation config from agent config
   *
   * @returns GenerationConfig object for Gemini
   */
  protected getGenerationConfig() {
    return {
      temperature: this.config.temperature,
      topK: this.config.topK,
      topP: this.config.topP,
    };
  }
}
