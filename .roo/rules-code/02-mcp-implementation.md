# MCP Implementation Guidelines

## Tool Structure Template

```typescript
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerVMTools(server: McpServer) {
  server.tool(
    'run_script',
    'Execute JavaScript code in isolated VM context',
    {
      code: z.string().describe('JavaScript code to execute'),
      contextId: z.string().optional().describe('VM context to use'),
      timeout: z.number().optional().default(5000).describe('Execution timeout in milliseconds'),
    },
    async ({ code, contextId, timeout }) => {
      try {
        const data = await vmService.executeScript(code, { contextId, timeout });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
```

## Parameter Validation

- **Required Parameters**: Mark with zod `.required()`
- **Optional Parameters**: Use `.optional()` with sensible defaults
- **Code Validation**: Validate JavaScript code and context IDs against known patterns
- **Type Validation**: Ensure correct data types for all inputs

## Response Format Standards

```typescript
// Success response
{
  content: [{
    type: 'text',
    text: JSON.stringify(data, null, 2)
  }]
}

// Error response
{
  content: [{
    type: 'text',
    text: 'Error: [descriptive message]'
  }],
  isError: true
}
```

## Tool Categories Implementation Order

1. **Core VM Tools** (implement in this order):
   - Context management tools (`create_context`, `list_contexts`, etc.)
   - Execution tools (`run_script`, `evaluate_code`, etc.)
   - Server info tools (`get_server_info`, etc.)

2. **Security and Monitoring Tools**: Implement after basic VM tools
3. **Validation Tools**: Context validation and security boundary tools
4. **Advanced Features**: Performance monitoring, memory tracking, logging

## Resource Implementation

```typescript
// Static resources
server.resource('vm-contexts', 'vm://contexts', async () => ({
  contents: [
    {
      uri: 'vm://contexts',
      mimeType: 'application/json',
      text: JSON.stringify(vmContexts),
    },
  ],
}));

// Dynamic resources
server.resource('context-info', 'vm://contexts/{contextId}/info', async (uri, { contextId }) => {
  const context = await vmManager.getContextInfo(contextId);
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(context),
      },
    ],
  };
});
```

## Prompt Templates

```typescript
// VM execution prompt
server.prompt(
  'execute-code',
  'Execute JavaScript code in a secure VM context',
  {
    language: z.enum(['javascript', 'typescript']).default('javascript'),
  },
  async ({ language }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Let's execute some ${language} code in a secure VM context. What would you like to run?`,
          },
        },
      ],
    };
  }
);
```

## Caching Strategy

- **Tool Results**: Cache based on parameters
- **VM Context Data**: Cache with TTL based on data volatility
- **Static Data**: Cache indefinitely with cache invalidation
- **Cache Keys**: Use consistent key generation for cache hits

## Error Handling Patterns

```typescript
// VM errors
class VMExecutionError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public contextId: string
  ) {
    super(message);
    this.name = 'VMExecutionError';
  }
}

// Validation errors
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```
