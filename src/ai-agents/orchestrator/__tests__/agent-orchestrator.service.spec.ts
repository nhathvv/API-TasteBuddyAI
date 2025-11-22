import { AgentOrchestratorService } from '../agent-orchestrator.service';
import { IAIAgent } from '../../base/base-agent.interface';

describe('AgentOrchestratorService', () => {
  let orchestrator: AgentOrchestratorService;

  const createMockAgent = <TOutput>(
    name: string,
    executeImpl: () => Promise<TOutput>,
  ): IAIAgent<unknown, TOutput> => ({
    execute: executeImpl,
    validate: jest.fn().mockReturnValue(true),
    getConfig: () => ({ name, modelType: 'flash' }),
  });

  beforeEach(() => {
    orchestrator = new AgentOrchestratorService();
    jest.useRealTimers();
  });

  it('executes agents sequentially and preserves order', async () => {
    const executionOrder: string[] = [];

    const firstAgent = createMockAgent('First', async () => {
      executionOrder.push('first');
      return 'first-result';
    });

    const secondAgent = createMockAgent('Second', async () => {
      executionOrder.push('second');
      return 'second-result';
    });

    const result = await orchestrator.runSequential([
      { agent: firstAgent, input: {} },
      { agent: secondAgent, input: {} },
    ]);

    expect(executionOrder).toEqual(['first', 'second']);
    expect(result.summary.total).toBe(2);
    expect(result.summary.failed).toBe(0);
    expect(result.results[0].output).toBe('first-result');
    expect(result.results[1].output).toBe('second-result');
  });

  it('executes agents in parallel and aggregates summary', async () => {
    const parallelAgentOne = createMockAgent('ParallelOne', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { id: 1 };
    });

    const parallelAgentTwo = createMockAgent('ParallelTwo', async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { id: 2 };
    });

    const result = await orchestrator.runParallel([
      { agent: parallelAgentOne, input: {} },
      { agent: parallelAgentTwo, input: {} },
    ]);

    expect(result.summary.total).toBe(2);
    expect(result.summary.succeeded).toBe(2);
    expect(result.summary.failed).toBe(0);
    expect(result.results.map((r) => r.agentName)).toEqual(
      expect.arrayContaining(['ParallelOne', 'ParallelTwo']),
    );
  });

  it('handles agent failure gracefully', async () => {
    const failingAgent = createMockAgent('FailureAgent', async () => {
      throw new Error('expected failure');
    });

    const succeedingAgent = createMockAgent('SuccessAgent', async () => 'ok');

    const result = await orchestrator.runSequential([
      { agent: failingAgent, input: {}, stopOnError: false },
      { agent: succeedingAgent, input: {} },
    ]);

    const failureResult = result.results.find(
      (res) => res.agentName === 'FailureAgent',
    );
    const successResult = result.results.find(
      (res) => res.agentName === 'SuccessAgent',
    );

    expect(failureResult?.success).toBe(false);
    expect(failureResult?.error).toContain('expected failure');
    expect(successResult?.success).toBe(true);
    expect(result.summary.failed).toBe(1);
    expect(result.summary.succeeded).toBe(1);
  });
});
