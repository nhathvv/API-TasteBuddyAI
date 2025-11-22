/**
 * Agent Configuration Interface
 *
 * Defines configuration options for AI agents
 */
export interface AgentConfig {
  /** Agent name for logging and identification */
  name: string;

  /** Model variant to use (pro or flash) */
  modelType: 'pro' | 'flash';

  /** Maximum execution timeout in milliseconds */
  timeout?: number;

  /** Enable caching for this agent's results */
  cacheable?: boolean;

  /** Cache TTL in seconds (if cacheable) */
  cacheTTL?: number;

  /** System instructions for the agent */
  systemInstruction?: string;

  /** Temperature for response generation (0.0 - 1.0) */
  temperature?: number;

  /** Top-K sampling parameter */
  topK?: number;

  /** Top-P sampling parameter */
  topP?: number;
}

/**
 * Base AI Agent Interface
 *
 * All AI agents must implement this interface to ensure consistency
 * and interoperability within the system.
 *
 * @template TInput - The input type for the agent
 * @template TOutput - The output type for the agent
 */
export interface IAIAgent<TInput, TOutput> {
  /**
   * Execute the agent with given input
   *
   * @param input - Typed input data for the agent
   * @returns Promise resolving to typed output
   * @throws {ValidationException} If input validation fails
   * @throws {AgentExecutionException} If agent execution fails
   */
  execute(input: TInput): Promise<TOutput>;

  /**
   * Validate input before processing
   *
   * @param input - Input to validate
   * @returns True if valid, false otherwise
   */
  validate(input: TInput): boolean;

  /**
   * Get agent configuration
   *
   * @returns Agent configuration object
   */
  getConfig(): AgentConfig;
}

/**
 * Cacheable Agent Interface
 *
 * Extends IAIAgent for agents that support result caching
 */
export interface ICacheableAgent<TInput, TOutput>
  extends IAIAgent<TInput, TOutput> {
  /**
   * Execute with caching support
   *
   * Checks cache before executing, stores result if not found
   *
   * @param input - Input data
   * @returns Cached or fresh result
   */
  executeWithCache(input: TInput): Promise<TOutput>;

  /**
   * Invalidate cached results for given input
   *
   * @param input - Input to invalidate cache for
   */
  invalidateCache(input: TInput): Promise<void>;

  /**
   * Generate cache key from input
   *
   * @param input - Input data
   * @returns Cache key string
   */
  getCacheKey(input: TInput): string;
}

/**
 * Batch Agent Interface
 *
 * For agents that support batch processing
 */
export interface IBatchAgent<TInput, TOutput>
  extends IAIAgent<TInput, TOutput> {
  /**
   * Execute multiple inputs in batch
   *
   * @param inputs - Array of inputs
   * @returns Array of outputs (same order as inputs)
   */
  executeBatch(inputs: TInput[]): Promise<TOutput[]>;

  /**
   * Get optimal batch size for this agent
   *
   * @returns Recommended batch size
   */
  getBatchSize(): number;
}
