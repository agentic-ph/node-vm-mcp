#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerPrompts } from './prompts/index.js';
import { registerResources } from './resources/index.js';
import { VMContextManager } from './services/vm-context-manager.js';
import { VMExecutionService } from './services/vm-execution-service.js';
import { registerTools } from './tools/index.js';
import { VMServerConfig } from './types/index.js';
import { setupGlobalErrorHandlers } from './utils/errors.js';

/**
 * Node VM MCP Server
 *
 * A Model Context Protocol server for executing JavaScript in isolated VM contexts
 * with configurable globals and security features.
 */
class NodeVMMCPServer {
  private server: McpServer;
  private contextManager: VMContextManager;
  private executionService: VMExecutionService;
  private config: VMServerConfig;

  constructor() {
    // Load configuration from environment
    this.config = this.loadConfig();

    // Initialize MCP server
    this.server = new McpServer({
      name: 'node-vm-mcp',
      version: '1.0.2',
    });

    // Initialize services
    this.contextManager = new VMContextManager(this.config);
    this.executionService = new VMExecutionService(this.contextManager, this.config);

    // Setup server components
    this.setupToolHandlers();
    this.setupErrorHandling();

    console.error('[VM MCP Server] Initialized with config:', {
      defaultTimeout: this.config.defaultTimeout,
      maxTimeout: this.config.maxTimeout,
      maxContexts: this.config.maxContexts,
      enableConsoleCapture: this.config.enableConsoleCapture,
      enableMemoryMonitoring: this.config.enableMemoryMonitoring,
      maxMemoryMB: this.config.maxMemoryMB,
    });
  }

  private loadConfig(): VMServerConfig {
    return {
      defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '5000'),
      maxTimeout: parseInt(process.env.MAX_TIMEOUT || '30000'),
      maxContexts: parseInt(process.env.MAX_CONTEXTS || '100'),
      enableConsoleCapture: process.env.ENABLE_CONSOLE_CAPTURE !== 'false',
      enableMemoryMonitoring: process.env.ENABLE_MEMORY_MONITORING !== 'false',
      maxMemoryMB: parseInt(process.env.MAX_MEMORY_MB || '128'),
      logLevel: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
    };
  }

  private setupToolHandlers(): void {
    // Register all tools, resources, and prompts
    registerTools(this.server, this.contextManager, this.executionService, this.config);
    registerResources(this.server);
    registerPrompts(this.server);
  }

  private setupErrorHandling(): void {
    // Setup global error handlers
    setupGlobalErrorHandlers();

    // Handle server shutdown gracefully
    process.on('SIGINT', () => {
      console.error('[VM MCP Server] Received SIGINT, shutting down gracefully...');
      this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.error('[VM MCP Server] Received SIGTERM, shutting down gracefully...');
      this.cleanup();
      process.exit(0);
    });
  }

  private cleanup(): void {
    try {
      // Cleanup all VM contexts
      this.contextManager.cleanup();
      console.error('[VM MCP Server] Cleanup completed');
    } catch (error) {
      console.error('[VM MCP Server] Error during cleanup:', error);
    }
  }

  async start(): Promise<void> {
    try {
      // Start the server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('[VM MCP Server] Running on stdio');
    } catch (error) {
      console.error('[VM MCP Server] Failed to start:', error);
      throw error;
    }
  }
}

// Start the server
async function main(): Promise<void> {
  const server = new NodeVMMCPServer();
  await server.start();
}

main().catch((error) => {
  console.error('[VM MCP Server] Failed to start:', error);
  process.exit(1);
});
