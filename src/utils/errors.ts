/**
 * Error handling utilities for the Node VM MCP Server
 */

/**
 * Base error class for all VM related errors
 */
export class VMError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public contextId?: string,
    public executionTime?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'VMError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, VMError.prototype);
  }

  /**
   * Convert error to JSON for serialization
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      contextId: this.contextId,
      executionTime: this.executionTime,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Error for VM execution timeout
 */
export class VMTimeoutError extends VMError {
  constructor(timeout: number, contextId?: string) {
    super(`Execution timed out after ${timeout}ms`, 'VM_TIMEOUT', 408, contextId);
    this.name = 'VMTimeoutError';
    Object.setPrototypeOf(this, VMTimeoutError.prototype);
  }
}

/**
 * Error for VM context related issues
 */
export class VMContextError extends VMError {
  constructor(message: string, contextId?: string, statusCode: number = 400, details?: unknown) {
    super(message, 'VM_CONTEXT_ERROR', statusCode, contextId, undefined, details);
    this.name = 'VMContextError';
    Object.setPrototypeOf(this, VMContextError.prototype);
  }
}

/**
 * Error for VM execution issues
 */
export class VMExecutionError extends VMError {
  constructor(message: string, contextId?: string, executionTime?: number, details?: unknown) {
    super(message, 'VM_EXECUTION_ERROR', 500, contextId, executionTime, details);
    this.name = 'VMExecutionError';
    Object.setPrototypeOf(this, VMExecutionError.prototype);
  }
}

/**
 * Error for VM security violations
 */
export class VMSecurityError extends VMError {
  constructor(message: string, contextId?: string, details?: unknown) {
    super(message, 'VM_SECURITY_ERROR', 403, contextId, undefined, details);
    this.name = 'VMSecurityError';
    Object.setPrototypeOf(this, VMSecurityError.prototype);
  }
}

/**
 * Error for VM memory issues
 */
export class VMMemoryError extends VMError {
  constructor(message: string, contextId?: string, memoryUsage?: number) {
    super(message, 'VM_MEMORY_ERROR', 507, contextId, undefined, { memoryUsage });
    this.name = 'VMMemoryError';
    Object.setPrototypeOf(this, VMMemoryError.prototype);
  }
}

/**
 * Error for validation issues
 */
export class ValidationError extends VMError {
  constructor(
    message: string,
    public field: string,
    details?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', 400, undefined, undefined, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Result type for operations that can fail
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
 * Error handler for MCP server
 */
export function createErrorHandler(): (error: Error) => void {
  return (error: Error): void => {
    console.error('[MCP Error]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  };
}

/**
 * Global error handlers for process
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    console.error('[Uncaught Exception]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Give time for logging then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    console.error('[Unhandled Rejection]', {
      reason:
        reason instanceof Error
          ? {
              name: reason.name,
              message: reason.message,
              stack: reason.stack,
            }
          : reason,
      promise: promise.toString(),
      timestamp: new Date().toISOString(),
    });

    // Give time for logging then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Safely extract error stack from unknown error
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * Create a sanitized error for client response
 */
export function sanitizeError(error: unknown): { message: string; code?: string; stack?: string } {
  if (error instanceof VMError) {
    return {
      message: error.message,
      code: error.code,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: getErrorMessage(error),
  };
}
