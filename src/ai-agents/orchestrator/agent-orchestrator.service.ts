import { Injectable, Logger } from '@nestjs/common';
import { IAIAgent } from '../base/base-agent.interface';

/**
 * Task description for orchestrator execution.
 */
export interface AgentExecutionTask<TInput = any, TOutput = any> {
  /** Agent instance to execute */
  agent: IAIAgent<TInput, TOutput>;
  /** Typed input for the agent */
  input: TInput;
  /** Optional label for logging/identification */
  label?: string;
  /** Stop sequential execution when this task fails (default: false) */
  stopOnError?: boolean;
}

/**
 * Result of a single agent execution.
 */
export interface AgentRunResult<TOutput = any> {
  agentName: string;
  label?: string;
  durationMs: number;
  success: boolean;
  output?: TOutput;
  error?: string;
}

/**
 * Aggregated orchestrator execution result.
 */
export interface OrchestratorRunResult {
  results: AgentRunResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    durationMs: number;
  };
}

/**
 * Agent Orchestrator Service
 *
 * Coordinates sequential and parallel execution of AI agents with
 * consistent logging, timing, and failure handling.
 */
@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  /**
   * Execute a list of agents sequentially.
   *
   * @param tasks Agent execution tasks in order
   * @returns Aggregated execution summary
   */
  async runSequential(tasks: AgentExecutionTask[]): Promise<OrchestratorRunResult> {
    const startedAt = Date.now();
    const results: AgentRunResult[] = [];

    for (const task of tasks) {
      const result = await this.executeTask(task);
      results.push(result);

      if (!result.success && task.stopOnError) {
        this.logger.warn(
          `Stopping pipeline because ${result.agentName} failed and stopOnError is true`,
        );
        break;
      }
    }

    return {
      results,
      summary: this.buildSummary(results, startedAt),
    };
  }

  /**
   * Execute a list of agents in parallel.
   *
   * @param tasks Agent execution tasks
   * @returns Aggregated execution summary
   */
  async runParallel(tasks: AgentExecutionTask[]): Promise<OrchestratorRunResult> {
    const startedAt = Date.now();

    const results = await Promise.all(tasks.map((task) => this.executeTask(task)));

    return {
      results,
      summary: this.buildSummary(results, startedAt),
    };
  }

  /**
   * Helper to execute a single agent task with logging and timing.
   */
  private async executeTask(task: AgentExecutionTask): Promise<AgentRunResult> {
    const startedAt = Date.now();
    const agentName =
      task.label || task.agent.getConfig?.().name || task.agent.constructor.name;

    this.logger.log(`Executing agent ${agentName}`);

    try {
      const output = await task.agent.execute(task.input);
      const durationMs = Date.now() - startedAt;

      this.logger.log(`Agent ${agentName} completed in ${durationMs}ms`);

      return {
        agentName,
        label: task.label,
        durationMs,
        success: true,
        output,
      };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Agent ${agentName} failed after ${durationMs}ms: ${message}`,
      );

      return {
        agentName,
        label: task.label,
        durationMs,
        success: false,
        error: message,
      };
    }
  }

  /**
   * Build aggregated summary from run results.
   */
  private buildSummary(results: AgentRunResult[], startedAt: number) {
    const succeeded = results.filter((result) => result.success).length;
    const failed = results.length - succeeded;

    return {
      total: results.length,
      succeeded,
      failed,
      durationMs: Date.now() - startedAt,
    };
  }
}
