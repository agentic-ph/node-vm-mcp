import * as vm from 'vm';
import {
  VMExecutionOptions,
  VMExecutionResult,
  VMServerConfig,
  ConsoleCapture,
} from '../types/index.js';
import {
  VMTimeoutError,
  VMExecutionError,
  VMSecurityError,
  VMMemoryError,
  success,
  failure,
  Result,
  sanitizeError,
} from '../utils/errors.js';
import { VMContextManager } from './vm-context-manager.js';

/**
 * VM Execution Service
 * Handles safe execution of JavaScript code in VM contexts
 */
export class VMExecutionService {
  private contextManager: VMContextManager;
  private config: VMServerConfig;

  constructor(contextManager: VMContextManager, config: VMServerConfig) {
    this.contextManager = contextManager;
    this.config = config;
  }

  /**
   * Execute JavaScript code in a VM context
   */
  async runScript(
    code: string,
    options: Partial<VMExecutionOptions> = {}
  ): Promise<Result<VMExecutionResult>> {
    const startTime = Date.now();
    let contextId = options.contextId;

    try {
      // Create context if not provided
      if (!contextId) {
        contextId = this.contextManager.generateContextId();
        const contextResult = await this.contextManager.createContext(contextId, {
          globalTemplates: ['console'], // Default to console for convenience
        });

        if (!contextResult.success) {
          return failure(contextResult.error);
        }
      }

      // Get context
      const contextResult = this.contextManager.getContext(contextId);
      if (!contextResult.success) {
        return failure(contextResult.error);
      }

      const vmContext = contextResult.data;

      // Check memory before execution
      const memoryCheck = this.contextManager.checkMemoryUsage();
      if (!memoryCheck.success) {
        return failure(memoryCheck.error);
      }

      // Setup console capture if enabled
      const consoleCapture = this.setupConsoleCapture(vmContext.context);

      // Compile script
      const script = new vm.Script(code, {
        filename: options.filename || 'vm-script.js',
        lineOffset: options.lineOffset || 0,
        columnOffset: options.columnOffset || 0,
      });

      // Execute with timeout
      const timeout = Math.min(
        options.timeout || this.config.defaultTimeout,
        this.config.maxTimeout
      );

      const result = await this.executeWithTimeout(
        script,
        vmContext.context,
        timeout,
        options.breakOnSigint || false
      );

      const executionTime = Date.now() - startTime;

      // Update context usage
      this.contextManager.updateContextUsage(contextId, executionTime);

      // Restore console if captured
      this.restoreConsole(vmContext.context, consoleCapture);

      const executionResult: VMExecutionResult = {
        success: true,
        result: result,
        executionTime,
        contextId,
        consoleOutput: this.config.enableConsoleCapture ? consoleCapture.logs : undefined,
        memoryUsage: this.config.enableMemoryMonitoring
          ? process.memoryUsage().heapUsed
          : undefined,
      };

      return success(executionResult);
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Update context usage even on error
      if (contextId) {
        this.contextManager.updateContextUsage(contextId, executionTime);
      }

      const executionResult: VMExecutionResult = {
        success: false,
        error: this.createVMError(error, contextId, executionTime),
        executionTime,
        contextId: contextId || 'unknown',
      };

      return success(executionResult);
    }
  }

  /**
   * Evaluate a JavaScript expression in a VM context
   */
  async evaluateExpression(
    expression: string,
    options: Partial<VMExecutionOptions> = {}
  ): Promise<Result<VMExecutionResult>> {
    // Wrap expression to ensure it returns a value
    const code = `(${expression})`;
    return this.runScript(code, options);
  }

  /**
   * Execute script with timeout protection
   */
  private async executeWithTimeout(
    script: vm.Script,
    context: vm.Context,
    timeout: number,
    breakOnSigint: boolean
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new VMTimeoutError(timeout));
      }, timeout);

      try {
        const result = script.runInContext(context, {
          timeout,
          breakOnSigint,
          displayErrors: true,
        });

        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Setup console capture for a context
   */
  private setupConsoleCapture(context: vm.Context): ConsoleCapture {
    const capture: ConsoleCapture = {
      logs: [],
      errors: [],
      warns: [],
      infos: [],
    };

    if (!this.config.enableConsoleCapture) {
      return capture;
    }

    // Store original console methods
    const originalConsole = context.console;

    if (originalConsole) {
      // Override console methods to capture output
      context.console = {
        ...originalConsole,
        log: (...args: unknown[]): void => {
          capture.logs.push(this.formatConsoleArgs(args));
          originalConsole.log(...args);
        },
        error: (...args: unknown[]): void => {
          capture.errors.push(this.formatConsoleArgs(args));
          originalConsole.error(...args);
        },
        warn: (...args: unknown[]): void => {
          capture.warns.push(this.formatConsoleArgs(args));
          originalConsole.warn(...args);
        },
        info: (...args: unknown[]): void => {
          capture.infos.push(this.formatConsoleArgs(args));
          originalConsole.info(...args);
        },
      };
    }

    return capture;
  }

  /**
   * Restore original console methods
   */
  private restoreConsole(_context: vm.Context, _capture: ConsoleCapture): void {
    if (!this.config.enableConsoleCapture) {
      return;
    }

    // Note: In a real implementation, we would store and restore the original console
    // For now, we'll leave the captured console in place
  }

  /**
   * Format console arguments for capture
   */
  private formatConsoleArgs(args: unknown[]): string {
    return args
      .map((arg) => {
        if (typeof arg === 'string') {
          return arg;
        }
        if (arg === null) {
          return 'null';
        }
        if (arg === undefined) {
          return 'undefined';
        }
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      })
      .join(' ');
  }

  /**
   * Create appropriate VM error from caught error
   */
  private createVMError(
    error: unknown,
    contextId?: string,
    executionTime?: number
  ): VMExecutionError {
    if (error instanceof VMTimeoutError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for specific VM error types
      if (error.message.includes('timeout')) {
        return new VMTimeoutError(this.config.defaultTimeout, contextId);
      }

      if (error.message.includes('memory') || error.message.includes('heap')) {
        return new VMMemoryError(`Memory error during execution: ${error.message}`, contextId);
      }

      if (error.message.includes('security') || error.message.includes('permission')) {
        return new VMSecurityError(
          `Security error during execution: ${error.message}`,
          contextId,
          sanitizeError(error)
        );
      }

      // Generic execution error
      return new VMExecutionError(
        `Execution error: ${error.message}`,
        contextId,
        executionTime,
        sanitizeError(error)
      );
    }

    // Unknown error type
    return new VMExecutionError(
      `Unknown execution error: ${String(error)}`,
      contextId,
      executionTime,
      error
    );
  }

  /**
   * Validate code for basic security issues
   */
  private validateCode(code: string): Result<boolean> {
    // Basic security checks
    const dangerousPatterns = [
      /require\s*\(/,
      /import\s+.*\s+from/,
      /eval\s*\(/,
      /Function\s*\(/,
      /process\./,
      /global\./,
      /globalThis\./,
      /__dirname/,
      /__filename/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return failure(
          new VMSecurityError(
            `Code contains potentially dangerous pattern: ${pattern.source}`,
            undefined,
            { pattern: pattern.source }
          )
        );
      }
    }

    return success(true);
  }

  /**
   * Pre-process code before execution
   */
  private preprocessCode(code: string): string {
    // Remove any potential shebang
    if (code.startsWith('#!')) {
      const lines = code.split('\n');
      lines[0] = '// ' + lines[0];
      code = lines.join('\n');
    }

    return code;
  }

  /**
   * Execute code with additional safety checks
   */
  async runScriptSafe(
    code: string,
    options: Partial<VMExecutionOptions> = {}
  ): Promise<Result<VMExecutionResult>> {
    // Validate code
    const validation = this.validateCode(code);
    if (!validation.success) {
      const executionResult: VMExecutionResult = {
        success: false,
        error: validation.error,
        executionTime: 0,
        contextId: options.contextId || 'unknown',
      };
      return success(executionResult);
    }

    // Preprocess code
    const processedCode = this.preprocessCode(code);

    // Execute with standard method
    return this.runScript(processedCode, options);
  }
}
