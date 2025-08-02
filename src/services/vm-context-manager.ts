import * as crypto from 'crypto';
import * as vm from 'vm';
import {
  VMContext,
  VMContextOptions,
  VMContextInfo,
  GlobalTemplate,
  GlobalTemplateDefinition,
  VMServerConfig,
} from '../types/index.js';
import {
  VMContextError,
  VMMemoryError,
  VMSecurityError,
  success,
  failure,
  Result,
} from '../utils/errors.js';

/**
 * Global template definitions for VM contexts
 */
const GLOBAL_TEMPLATES: Record<GlobalTemplate, GlobalTemplateDefinition> = {
  console: {
    console: {
      log: (...args: unknown[]) => console.log('[VM]', ...args),
      error: (...args: unknown[]) => console.error('[VM]', ...args),
      warn: (...args: unknown[]) => console.warn('[VM]', ...args),
      info: (...args: unknown[]) => console.info('[VM]', ...args),
      debug: (...args: unknown[]) => console.debug('[VM]', ...args),
      trace: (...args: unknown[]) => console.trace('[VM]', ...args),
    },
  },
  timers: {
    setTimeout: (fn: () => void, delay: number) => setTimeout(fn, Math.min(delay, 30000)),
    setInterval: (fn: () => void, delay: number) => setInterval(fn, Math.max(delay, 100)),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
    setImmediate: (fn: () => void) => setImmediate(fn),
    clearImmediate: (id: ReturnType<typeof setImmediate>) => clearImmediate(id),
  },
  crypto: {
    crypto: {
      randomUUID: crypto.randomUUID,
      getRandomValues: (array: Uint8Array) => crypto.getRandomValues(array),
    },
  },
  buffer: {
    Buffer: Buffer,
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
  },
  url: {
    URL: URL,
    URLSearchParams: URLSearchParams,
  },
  process: {
    process: {
      env: { NODE_ENV: process.env.NODE_ENV || 'production' },
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  },
};

/**
 * VM Context Manager
 * Handles creation, management, and cleanup of VM contexts
 */
export class VMContextManager {
  private contexts: Map<string, VMContext> = new Map();
  private config: VMServerConfig;

  constructor(config: VMServerConfig) {
    this.config = config;
    this.setupCleanupInterval();
  }

  /**
   * Create a new VM context
   */
  async createContext(
    contextId: string,
    options: VMContextOptions = {}
  ): Promise<Result<VMContext>> {
    try {
      // Check if context already exists
      if (this.contexts.has(contextId)) {
        return failure(new VMContextError(`Context '${contextId}' already exists`, contextId));
      }

      // Check context limit
      if (this.contexts.size >= this.config.maxContexts) {
        return failure(
          new VMContextError(
            `Maximum number of contexts (${this.config.maxContexts}) reached`,
            contextId
          )
        );
      }

      // Build globals object
      const globals = this.buildGlobals(options);

      // Create VM context
      const context = vm.createContext(globals, {
        name: options.name || `VM Context ${contextId}`,
        origin: 'vm-mcp-server',
        codeGeneration: options.codeGeneration || {
          strings: true,
          wasm: true,
        },
        microtaskMode: options.microtaskMode === 'afterEvaluate' ? 'afterEvaluate' : undefined,
      });

      // Create context object
      const vmContext: VMContext = {
        id: contextId,
        name: options.name,
        context,
        globals,
        createdAt: new Date(),
        lastUsed: new Date(),
        executionCount: 0,
        options,
      };

      // Store context
      this.contexts.set(contextId, vmContext);

      return success(vmContext);
    } catch (error) {
      return failure(
        new VMContextError(
          `Failed to create context: ${error instanceof Error ? error.message : 'Unknown error'}`,
          contextId,
          500,
          error
        )
      );
    }
  }

  /**
   * Get a context by ID
   */
  getContext(contextId: string): Result<VMContext> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return failure(new VMContextError(`Context '${contextId}' not found`, contextId, 404));
    }

    // Update last used timestamp
    context.lastUsed = new Date();
    return success(context);
  }

  /**
   * Get context info without the actual VM context
   */
  getContextInfo(contextId: string): Result<VMContextInfo> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return failure(new VMContextError(`Context '${contextId}' not found`, contextId, 404));
    }

    const info: VMContextInfo = {
      id: context.id,
      name: context.name,
      createdAt: context.createdAt,
      lastUsed: context.lastUsed,
      executionCount: context.executionCount,
      memoryUsage: context.memoryUsage,
      globalKeys: Object.keys(context.globals),
      options: context.options,
    };

    return success(info);
  }

  /**
   * List all contexts
   */
  listContexts(includeDetails: boolean = false): VMContextInfo[] {
    const contexts: VMContextInfo[] = [];

    for (const context of this.contexts.values()) {
      const info: VMContextInfo = {
        id: context.id,
        name: context.name,
        createdAt: context.createdAt,
        lastUsed: context.lastUsed,
        executionCount: context.executionCount,
        memoryUsage: context.memoryUsage,
        globalKeys: includeDetails ? Object.keys(context.globals) : [],
        options: includeDetails ? context.options : ({} as VMContextOptions),
      };
      contexts.push(info);
    }

    return contexts.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  }

  /**
   * Destroy a context
   */
  destroyContext(contextId: string): Result<boolean> {
    const context = this.contexts.get(contextId);
    if (!context) {
      return failure(new VMContextError(`Context '${contextId}' not found`, contextId, 404));
    }

    // Remove from storage
    this.contexts.delete(contextId);

    return success(true);
  }

  /**
   * Update context execution count and last used time
   */
  updateContextUsage(contextId: string, _executionTime?: number): void {
    const context = this.contexts.get(contextId);
    if (context) {
      context.lastUsed = new Date();
      context.executionCount++;

      if (this.config.enableMemoryMonitoring) {
        context.memoryUsage = process.memoryUsage().heapUsed;
      }
    }
  }

  /**
   * Generate a unique context ID
   */
  generateContextId(): string {
    let id: string;
    do {
      id = `ctx_${crypto.randomBytes(8).toString('hex')}`;
    } while (this.contexts.has(id));
    return id;
  }

  /**
   * Get total number of contexts
   */
  getContextCount(): number {
    return this.contexts.size;
  }

  /**
   * Check memory usage across all contexts
   */
  checkMemoryUsage(): Result<boolean> {
    if (!this.config.enableMemoryMonitoring) {
      return success(true);
    }

    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;

    if (heapUsedMB > this.config.maxMemoryMB) {
      return failure(
        new VMMemoryError(
          `Memory usage (${heapUsedMB.toFixed(2)}MB) exceeds limit (${this.config.maxMemoryMB}MB)`,
          undefined,
          heapUsedMB
        )
      );
    }

    return success(true);
  }

  /**
   * Build globals object from options
   */
  private buildGlobals(options: VMContextOptions): Record<string, unknown> {
    const globals: Record<string, unknown> = {};

    // Add global templates
    if (options.globalTemplates) {
      for (const template of options.globalTemplates) {
        if (GLOBAL_TEMPLATES[template]) {
          Object.assign(globals, GLOBAL_TEMPLATES[template]);
        }
      }
    }

    // Add custom globals
    if (options.globals) {
      // Validate custom globals for security
      this.validateGlobals(options.globals);
      Object.assign(globals, options.globals);
    }

    return globals;
  }

  /**
   * Validate custom globals for security
   */
  private validateGlobals(globals: Record<string, unknown>): void {
    const dangerousKeys = [
      'require',
      'module',
      'exports',
      '__dirname',
      '__filename',
      'global',
      'globalThis',
      'process',
      'Buffer',
    ];

    for (const key of Object.keys(globals)) {
      if (dangerousKeys.includes(key)) {
        throw new VMSecurityError(`Dangerous global key '${key}' is not allowed`, undefined, {
          key,
          value: globals[key],
        });
      }
    }
  }

  /**
   * Setup cleanup interval for unused contexts
   */
  private setupCleanupInterval(): void {
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    const MAX_IDLE_TIME = 30 * 60 * 1000; // 30 minutes

    setInterval(() => {
      const now = Date.now();
      const contextsToDelete: string[] = [];

      for (const [id, context] of this.contexts.entries()) {
        const idleTime = now - context.lastUsed.getTime();
        if (idleTime > MAX_IDLE_TIME) {
          contextsToDelete.push(id);
        }
      }

      for (const id of contextsToDelete) {
        this.contexts.delete(id);
        console.log(`[VM Context Manager] Cleaned up idle context: ${id}`);
      }
    }, CLEANUP_INTERVAL);
  }

  /**
   * Cleanup all contexts (for shutdown)
   */
  cleanup(): void {
    this.contexts.clear();
  }
}
