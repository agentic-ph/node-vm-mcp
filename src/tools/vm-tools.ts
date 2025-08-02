import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { VMContextManager } from '../services/vm-context-manager.js';
import { VMExecutionService } from '../services/vm-execution-service.js';
import {
  CreateContextSchema,
  RunScriptSchema,
  EvaluateCodeSchema,
  ListContextsSchema,
  GetContextInfoSchema,
  DestroyContextSchema,
  VMServerConfig,
} from '../types/index.js';
import { sanitizeError } from '../utils/errors.js';

/**
 * Register VM-related MCP tools
 */
export function registerVMTools(
  server: McpServer,
  contextManager: VMContextManager,
  executionService: VMExecutionService,
  config: VMServerConfig
): void {
  /**
   * Create Context Tool
   * Creates a new isolated VM execution context
   */
  server.tool(
    'create_context',
    'Create a new isolated VM execution context with configurable globals',
    CreateContextSchema.shape,
    async ({ contextId, name, globals, globalTemplates, options }) => {
      try {
        const contextOptions = {
          name,
          globals,
          globalTemplates,
          ...options,
        };

        const result = await contextManager.createContext(contextId, contextOptions);

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: result.error.message,
                    code: result.error.code,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const context = result.data;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  context: {
                    id: context.id,
                    name: context.name,
                    createdAt: context.createdAt,
                    globalKeys: Object.keys(context.globals),
                    options: context.options,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: 'Failed to create context',
                  details: sanitizeError(error),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Run Script Tool
   * Execute JavaScript code in a VM context
   */
  server.tool(
    'run_script',
    'Execute JavaScript code in an isolated VM context with timeout and security controls',
    RunScriptSchema.shape,
    async ({ code, contextId, timeout, filename, displayErrors }) => {
      try {
        const executionOptions = {
          contextId,
          timeout: timeout || config.defaultTimeout,
          filename,
          displayErrors,
        };

        const result = await executionService.runScript(code, executionOptions);

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: result.error.message,
                    code: result.error.code,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const executionResult = result.data;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: executionResult.success,
                  result: executionResult.result,
                  executionTime: executionResult.executionTime,
                  contextId: executionResult.contextId,
                  consoleOutput: executionResult.consoleOutput,
                  memoryUsage: executionResult.memoryUsage,
                  error: executionResult.error
                    ? {
                        message: executionResult.error.message,
                        code: executionResult.error.code,
                      }
                    : undefined,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: 'Failed to execute script',
                  details: sanitizeError(error),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Evaluate Code Tool
   * Evaluate a JavaScript expression and return the result
   */
  server.tool(
    'evaluate_code',
    'Evaluate a JavaScript expression in a VM context and return the result',
    EvaluateCodeSchema.shape,
    async ({ expression, contextId, timeout }) => {
      try {
        const executionOptions = {
          contextId,
          timeout: timeout || config.defaultTimeout,
          filename: 'eval-expression.js',
        };

        const result = await executionService.evaluateExpression(expression, executionOptions);

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: result.error.message,
                    code: result.error.code,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const executionResult = result.data;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: executionResult.success,
                  result: executionResult.result,
                  executionTime: executionResult.executionTime,
                  contextId: executionResult.contextId,
                  error: executionResult.error
                    ? {
                        message: executionResult.error.message,
                        code: executionResult.error.code,
                      }
                    : undefined,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: 'Failed to evaluate expression',
                  details: sanitizeError(error),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * List Contexts Tool
   * List all active VM contexts
   */
  server.tool(
    'list_contexts',
    'List all active VM contexts with their metadata',
    ListContextsSchema.shape,
    async ({ includeDetails }) => {
      try {
        const contexts = contextManager.listContexts(includeDetails);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  contexts,
                  totalCount: contexts.length,
                  maxContexts: config.maxContexts,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: 'Failed to list contexts',
                  details: sanitizeError(error),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Get Context Info Tool
   * Get detailed information about a specific context
   */
  server.tool(
    'get_context_info',
    'Get detailed information about a specific VM context',
    GetContextInfoSchema.shape,
    async ({ contextId }) => {
      try {
        const result = contextManager.getContextInfo(contextId);

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: result.error.message,
                    code: result.error.code,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  context: result.data,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: 'Failed to get context info',
                  details: sanitizeError(error),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Destroy Context Tool
   * Clean up and remove a VM context
   */
  server.tool(
    'destroy_context',
    'Clean up and remove a VM context to free resources',
    DestroyContextSchema.shape,
    async ({ contextId }) => {
      try {
        const result = contextManager.destroyContext(contextId);

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: result.error.message,
                    code: result.error.code,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Context '${contextId}' has been destroyed`,
                  contextId,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: 'Failed to destroy context',
                  details: sanitizeError(error),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Get Server Info Tool
   * Get information about the VM server configuration and status
   */
  server.tool(
    'get_server_info',
    'Get information about the VM server configuration and current status',
    {},
    async () => {
      try {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  server: {
                    name: 'Node VM MCP Server',
                    version: '1.0.2',
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    uptime: Math.floor(uptime),
                    memoryUsage: {
                      rss: Math.round(memoryUsage.rss / 1024 / 1024),
                      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                      external: Math.round(memoryUsage.external / 1024 / 1024),
                    },
                    config: {
                      defaultTimeout: config.defaultTimeout,
                      maxTimeout: config.maxTimeout,
                      maxContexts: config.maxContexts,
                      enableConsoleCapture: config.enableConsoleCapture,
                      enableMemoryMonitoring: config.enableMemoryMonitoring,
                      maxMemoryMB: config.maxMemoryMB,
                    },
                    contexts: {
                      active: contextManager.getContextCount(),
                      max: config.maxContexts,
                    },
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: 'Failed to get server info',
                  details: sanitizeError(error),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
