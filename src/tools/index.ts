import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { VMContextManager } from '../services/vm-context-manager.js';
import { VMExecutionService } from '../services/vm-execution-service.js';
import { VMServerConfig } from '../types/index.js';
import { registerVMTools } from './vm-tools.js';

// Register all MCP Server Tools
export function registerTools(
  server: McpServer,
  contextManager: VMContextManager,
  executionService: VMExecutionService,
  config: VMServerConfig
): void {
  // Register VM-related tools
  registerVMTools(server, contextManager, executionService, config);
}
