import * as vm from 'vm';
import { z } from 'zod';

/**
 * Global template types for VM contexts
 */
export type GlobalTemplate = 'console' | 'timers' | 'crypto' | 'buffer' | 'url' | 'process';

/**
 * VM Context Options Schema
 */
export const VMContextOptionsSchema = z.object({
  name: z.string().optional().describe('Human-readable name for the context'),
  globals: z.record(z.any()).optional().describe('Custom global variables to include'),
  globalTemplates: z
    .array(z.enum(['console', 'timers', 'crypto', 'buffer', 'url', 'process']))
    .optional()
    .describe('Predefined global templates to include'),
  codeGeneration: z
    .object({
      strings: z
        .boolean()
        .optional()
        .default(true)
        .describe('Allow eval and function constructors'),
      wasm: z.boolean().optional().default(true).describe('Allow WebAssembly compilation'),
    })
    .optional(),
  microtaskMode: z
    .enum(['afterEvaluate', 'default'])
    .optional()
    .describe('Microtask execution mode'),
});

export type VMContextOptions = z.infer<typeof VMContextOptionsSchema>;

/**
 * VM Execution Options Schema
 */
export const VMExecutionOptionsSchema = z.object({
  timeout: z.number().min(1).max(30000).optional().describe('Execution timeout in milliseconds'),
  breakOnSigint: z.boolean().optional().describe('Break execution on SIGINT'),
  displayErrors: z.boolean().optional().describe('Include error details in output'),
  filename: z.string().optional().describe('Filename for stack traces'),
  lineOffset: z.number().optional().describe('Line number offset for stack traces'),
  columnOffset: z.number().optional().describe('Column number offset for stack traces'),
  contextId: z.string().optional().describe('Specific context ID to use'),
});

export type VMExecutionOptions = z.infer<typeof VMExecutionOptionsSchema>;

/**
 * VM Context interface
 */
export interface VMContext {
  id: string;
  name?: string;
  context: vm.Context;
  globals: Record<string, unknown>;
  createdAt: Date;
  lastUsed: Date;
  executionCount: number;
  memoryUsage?: number;
  options: VMContextOptions;
}

/**
 * VM Execution Result interface
 */
export interface VMExecutionResult {
  success: boolean;
  result?: unknown;
  error?: VMError;
  executionTime: number;
  memoryUsage?: number;
  consoleOutput?: string[];
  contextId: string;
}

/**
 * VM Context Info interface
 */
export interface VMContextInfo {
  id: string;
  name?: string;
  createdAt: Date;
  lastUsed: Date;
  executionCount: number;
  memoryUsage?: number;
  globalKeys: string[];
  options: VMContextOptions;
}

/**
 * Console capture interface
 */
export interface ConsoleCapture {
  logs: string[];
  errors: string[];
  warns: string[];
  infos: string[];
}

/**
 * Global template definitions
 */
export interface GlobalTemplateDefinition {
  [key: string]: unknown;
}

/**
 * VM Error classes
 */
export class VMError extends Error {
  constructor(
    message: string,
    public code: string,
    public contextId?: string,
    public executionTime?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'VMError';
    Object.setPrototypeOf(this, VMError.prototype);
  }

  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      contextId: this.contextId,
      executionTime: this.executionTime,
      details: this.details,
      stack: this.stack,
    };
  }
}

export class VMTimeoutError extends VMError {
  constructor(timeout: number, contextId?: string) {
    super(`Execution timed out after ${timeout}ms`, 'VM_TIMEOUT', contextId);
    this.name = 'VMTimeoutError';
    Object.setPrototypeOf(this, VMTimeoutError.prototype);
  }
}

export class VMContextError extends VMError {
  constructor(message: string, contextId: string, details?: unknown) {
    super(message, 'VM_CONTEXT_ERROR', contextId, undefined, details);
    this.name = 'VMContextError';
    Object.setPrototypeOf(this, VMContextError.prototype);
  }
}

export class VMExecutionError extends VMError {
  constructor(message: string, contextId?: string, executionTime?: number, details?: unknown) {
    super(message, 'VM_EXECUTION_ERROR', contextId, executionTime, details);
    this.name = 'VMExecutionError';
    Object.setPrototypeOf(this, VMExecutionError.prototype);
  }
}

export class VMSecurityError extends VMError {
  constructor(message: string, contextId?: string, details?: unknown) {
    super(message, 'VM_SECURITY_ERROR', contextId, undefined, details);
    this.name = 'VMSecurityError';
    Object.setPrototypeOf(this, VMSecurityError.prototype);
  }
}

export class VMMemoryError extends VMError {
  constructor(message: string, contextId?: string, memoryUsage?: number) {
    super(message, 'VM_MEMORY_ERROR', contextId, undefined, { memoryUsage });
    this.name = 'VMMemoryError';
    Object.setPrototypeOf(this, VMMemoryError.prototype);
  }
}

/**
 * Result type pattern for error handling
 */
export type Result<T, E = VMError> = { success: true; data: T } | { success: false; error: E };

/**
 * Create a success result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function failure<E extends VMError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * MCP Tool Schemas
 */

// Create Context Tool Schema
export const CreateContextSchema = z.object({
  contextId: z.string().min(1).describe('Unique identifier for the context'),
  name: z.string().optional().describe('Human-readable name for the context'),
  globals: z.record(z.any()).optional().describe('Custom global variables to include'),
  globalTemplates: z
    .array(z.enum(['console', 'timers', 'crypto', 'buffer', 'url', 'process']))
    .optional()
    .describe('Predefined global templates to include'),
  options: VMContextOptionsSchema.optional().describe('Additional context options'),
});

// Run Script Tool Schema
export const RunScriptSchema = z.object({
  code: z.string().min(1).describe('JavaScript code to execute'),
  contextId: z.string().optional().describe('Context ID (creates new if not specified)'),
  timeout: z.number().min(1).max(30000).optional().describe('Execution timeout in milliseconds'),
  filename: z.string().optional().describe('Filename for stack traces'),
  displayErrors: z.boolean().optional().default(true).describe('Include error details in output'),
});

// Evaluate Code Tool Schema
export const EvaluateCodeSchema = z.object({
  expression: z.string().min(1).describe('JavaScript expression to evaluate'),
  contextId: z.string().optional().describe('Context ID to use for evaluation'),
  timeout: z.number().min(1).max(30000).optional().describe('Evaluation timeout in milliseconds'),
});

// List Contexts Tool Schema
export const ListContextsSchema = z.object({
  includeDetails: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include detailed context information'),
});

// Get Context Info Tool Schema
export const GetContextInfoSchema = z.object({
  contextId: z.string().min(1).describe('Context ID to inspect'),
});

// Destroy Context Tool Schema
export const DestroyContextSchema = z.object({
  contextId: z.string().min(1).describe('Context ID to destroy'),
});

/**
 * Configuration interfaces
 */
export interface VMServerConfig {
  defaultTimeout: number;
  maxTimeout: number;
  maxContexts: number;
  enableConsoleCapture: boolean;
  enableMemoryMonitoring: boolean;
  maxMemoryMB: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Memory monitoring interface
 */
export interface MemoryUsage {
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}
