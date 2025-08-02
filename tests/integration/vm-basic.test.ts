import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VMContextManager } from '../../src/services/vm-context-manager.js';
import { VMExecutionService } from '../../src/services/vm-execution-service.js';
import { VMServerConfig } from '../../src/types/index.js';

describe('VM Basic Functionality', () => {
  let contextManager: VMContextManager;
  let executionService: VMExecutionService;
  let config: VMServerConfig;

  beforeEach(() => {
    config = {
      defaultTimeout: 5000,
      maxTimeout: 30000,
      maxContexts: 100,
      enableConsoleCapture: true,
      enableMemoryMonitoring: true,
      maxMemoryMB: 128,
      logLevel: 'error',
    };

    contextManager = new VMContextManager(config);
    executionService = new VMExecutionService(contextManager, config);
  });

  afterEach(() => {
    contextManager.cleanup();
  });

  describe('Context Management', () => {
    it('should create a new context successfully', async () => {
      const result = await contextManager.createContext('test-context', {
        name: 'Test Context',
        globalTemplates: ['console'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('test-context');
        expect(result.data.name).toBe('Test Context');
        expect(result.data.globals).toHaveProperty('console');
      }
    });

    it('should list contexts correctly', () => {
      contextManager.createContext('context1', { name: 'Context 1' });
      contextManager.createContext('context2', { name: 'Context 2' });

      const contexts = contextManager.listContexts();
      expect(contexts).toHaveLength(2);
      expect(contexts.map((c) => c.id)).toContain('context1');
      expect(contexts.map((c) => c.id)).toContain('context2');
    });

    it('should destroy context successfully', async () => {
      await contextManager.createContext('temp-context', { name: 'Temporary' });

      const result = contextManager.destroyContext('temp-context');
      expect(result.success).toBe(true);

      const contexts = contextManager.listContexts();
      expect(contexts.map((c) => c.id)).not.toContain('temp-context');
    });
  });

  describe('Code Execution', () => {
    it('should execute simple JavaScript code', async () => {
      const result = await executionService.runScript('2 + 2', {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.result).toBe(4);
        expect(result.data.executionTime).toBeGreaterThan(0);
      }
    });

    it('should capture console output', async () => {
      const code = `
        console.log('Hello, World!');
        console.log('This is a log message');
        'test result';
      `;

      const result = await executionService.runScript(code, {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.result).toBe('test result');
        expect(result.data.consoleOutput).toContain('Hello, World!');
        expect(result.data.consoleOutput).toContain('This is a log message');
      }
    });

    it('should handle syntax errors gracefully', async () => {
      const result = await executionService.runScript('const x = ;', {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(false);
        expect(result.data.error).toBeDefined();
        expect(result.data.error?.message).toContain('Unexpected token');
      }
    });

    it('should enforce timeout limits', async () => {
      const code = 'while(true) {}'; // Infinite loop

      const result = await executionService.runScript(code, { timeout: 100 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(false);
        expect(result.data.error?.message).toContain('timed out');
      }
    });

    it('should evaluate expressions correctly', async () => {
      const result = await executionService.evaluateExpression(
        'Math.sqrt(16) + Math.pow(2, 3)',
        {}
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.result).toBe(12); // 4 + 8
      }
    });
  });

  describe('Global Templates', () => {
    it('should provide console globals', async () => {
      const contextResult = await contextManager.createContext('console-test', {
        globalTemplates: ['console'],
      });

      expect(contextResult.success).toBe(true);

      const execResult = await executionService.runScript('typeof console.log', {
        contextId: 'console-test',
      });

      expect(execResult.success).toBe(true);
      if (execResult.success) {
        expect(execResult.data.result).toBe('function');
      }
    });

    it('should provide timer globals with limits', async () => {
      const contextResult = await contextManager.createContext('timer-test', {
        globalTemplates: ['timers'],
      });

      expect(contextResult.success).toBe(true);

      const execResult = await executionService.runScript('typeof setTimeout', {
        contextId: 'timer-test',
      });

      expect(execResult.success).toBe(true);
      if (execResult.success) {
        expect(execResult.data.result).toBe('function');
      }
    });
  });

  describe('Security Features', () => {
    it('should block require() calls', async () => {
      const result = await executionService.runScript('require("fs")', {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(false);
        expect(result.data.error?.message).toContain('require is not defined');
      }
    });

    it('should allow eval() calls (VM context has eval available)', async () => {
      const result = await executionService.runScript('eval("2 + 2")', {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.result).toBe(4);
      }
    });

    it('should isolate contexts from each other', async () => {
      await contextManager.createContext('context-a', {});
      await contextManager.createContext('context-b', {});

      // Set variable in context A
      await executionService.runScript('globalThis.testVar = "A"', { contextId: 'context-a' });

      // Check that context B doesn't have the variable
      const result = await executionService.runScript('typeof globalThis.testVar', {
        contextId: 'context-b',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.result).toBe('undefined');
      }
    });
  });

  describe('Memory Monitoring', () => {
    it('should track memory usage', async () => {
      const result = await executionService.runScript(
        'const arr = new Array(1000).fill("test"); arr.length',
        {}
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.memoryUsage).toBeDefined();
        expect(typeof result.data.memoryUsage).toBe('number');
        expect(result.data.memoryUsage).toBeGreaterThan(0);
      }
    });
  });
});
