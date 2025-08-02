import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * Register all VM-related prompts with the MCP server
 */
export function registerPrompts(server: McpServer): void {
  // VM Quick Start Prompt
  server.prompt(
    'vm-quick-start',
    'Get started with VM execution - create a context and run your first script',
    {
      contextName: z.string().optional().describe('Optional name for the VM context'),
      includeGlobals: z
        .string()
        .optional()
        .describe(
          'Comma-separated global templates to include (console,timers,crypto,buffer,url,process)'
        ),
    },
    async ({ contextName, includeGlobals }) => {
      const contextId = `quick_start_${Date.now()}`;
      const globals = includeGlobals ? includeGlobals.split(',').map((g) => g.trim()) : ['console'];

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Let's get started with VM execution! I'll help you create a context and run your first script.

**Step 1: Create a VM Context**
Use the \`create_context\` tool with these parameters:
\`\`\`json
{
  "contextId": "${contextId}",
  "name": "${contextName || 'Quick Start Context'}",
  "globalTemplates": ${JSON.stringify(globals)}
}
\`\`\`

**Step 2: Run Your First Script**
Once the context is created, try running this simple script:
\`\`\`json
{
  "code": "console.log('Hello from VM!'); const result = 2 + 2; console.log('2 + 2 =', result); result;",
  "contextId": "${contextId}"
}
\`\`\`

**Available Global Templates:**
- \`console\`: Logging functions
- \`timers\`: setTimeout, setInterval (with safety limits)
- \`crypto\`: Basic crypto functions
- \`buffer\`: Buffer and text encoding
- \`url\`: URL constructors
- \`process\`: Limited process info

What would you like to try first?`,
            },
          },
        ],
      };
    }
  );

  // VM Security Best Practices Prompt
  server.prompt(
    'vm-security-guide',
    'Learn about VM security features and best practices',
    {},
    async () => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `# VM Security Guide

## Built-in Security Features

### Execution Limits
- **Timeout Protection**: All scripts have configurable timeouts (default: 5s, max: 30s)
- **Memory Monitoring**: Track and limit memory usage per context
- **Context Isolation**: Each VM context is completely isolated from others

### Restricted Access
The VM automatically blocks dangerous patterns:
- \`require()\` and \`import\` statements
- \`eval()\` and \`Function()\` constructors (unless explicitly enabled)
- Access to \`process\`, \`global\`, \`__dirname\`, \`__filename\`

### Safe Globals
Instead of full access, use controlled global templates:

**Console Template**
\`\`\`json
{"globalTemplates": ["console"]}
\`\`\`
Provides: \`console.log\`, \`console.error\`, etc.

**Timers Template**
\`\`\`json
{"globalTemplates": ["timers"]}
\`\`\`
Provides: \`setTimeout\` (max 30s), \`setInterval\` (min 100ms), etc.

**Crypto Template**
\`\`\`json
{"globalTemplates": ["crypto"]}
\`\`\`
Provides: \`crypto.randomUUID\`, \`crypto.getRandomValues\`

## Best Practices

1. **Always set timeouts** for user-provided code
2. **Use specific global templates** instead of custom globals
3. **Monitor context count** and clean up unused contexts
4. **Validate input** before execution
5. **Use \`evaluate_code\`** for simple expressions

Would you like to see examples of secure VM usage?`,
            },
          },
        ],
      };
    }
  );

  // VM Debugging Helper Prompt
  server.prompt(
    'vm-debug-helper',
    'Help debug VM execution issues and errors',
    {
      errorType: z
        .enum(['timeout', 'memory', 'syntax', 'runtime', 'security'])
        .optional()
        .describe('Type of error you are experiencing'),
    },
    async ({ errorType }) => {
      const debugGuides = {
        timeout: `## Timeout Errors

**Symptoms**: Execution stops with "timed out after Xms"

**Solutions**:
1. Increase timeout: \`{"timeout": 10000}\` (10 seconds)
2. Optimize your code to run faster
3. Break large operations into smaller chunks
4. Use \`setImmediate\` for yielding control

**Example**:
\`\`\`javascript
// Instead of blocking loop
for (let i = 0; i < 1000000; i++) { /* work */ }

// Use yielding approach
function processChunk(start, end) {
  for (let i = start; i < end; i++) { /* work */ }
  if (end < 1000000) {
    setImmediate(() => processChunk(end, Math.min(end + 1000, 1000000)));
  }
}
processChunk(0, 1000);
\`\`\``,

        memory: `## Memory Errors

**Symptoms**: "Memory usage exceeds limit" or out of memory

**Solutions**:
1. Avoid creating large objects or arrays
2. Clean up variables when done: \`variable = null\`
3. Use streaming for large data processing
4. Monitor memory with \`get_server_info\` tool

**Example**:
\`\`\`javascript
// Memory-efficient processing
function processData(data) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    result.push(transform(data[i]));
    // Clean up processed item
    data[i] = null;
  }
  return result;
}
\`\`\``,

        syntax: `## Syntax Errors

**Symptoms**: "SyntaxError" during script compilation

**Solutions**:
1. Check for missing brackets, quotes, semicolons
2. Validate JSON if parsing data
3. Use proper JavaScript syntax
4. Test code in a regular JavaScript environment first

**Common Issues**:
- Missing closing brackets: \`}\`, \`]\`, \`)\`
- Unmatched quotes: \`"\` or \`'\`
- Invalid object syntax: \`{key: value}\` not \`{key value}\``,

        runtime: `## Runtime Errors

**Symptoms**: Code compiles but fails during execution

**Solutions**:
1. Check for undefined variables or functions
2. Validate object properties before access
3. Handle null/undefined values
4. Use try-catch for error handling

**Example**:
\`\`\`javascript
// Safe property access
const value = obj && obj.property ? obj.property : 'default';

// Error handling
try {
  const result = riskyOperation();
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
}
\`\`\``,

        security: `## Security Errors

**Symptoms**: "Security error" or blocked operations

**Solutions**:
1. Use global templates instead of custom globals
2. Avoid restricted patterns (require, eval, etc.)
3. Use safe alternatives for blocked operations

**Blocked vs Safe**:
- ❌ \`require('fs')\` → ✅ Use provided globals
- ❌ \`eval(code)\` → ✅ Use \`evaluate_code\` tool
- ❌ \`process.exit()\` → ✅ Use return statements
- ❌ \`global.myVar\` → ✅ Use context globals`,
      };

      const guide = errorType
        ? debugGuides[errorType]
        : `## VM Debugging Guide

Choose your error type for specific help:
- **timeout**: Script execution timeouts
- **memory**: Memory usage issues
- **syntax**: Code compilation errors
- **runtime**: Execution failures
- **security**: Security restrictions

**General Debugging Steps**:
1. Start with simple code and add complexity gradually
2. Use \`console.log\` for debugging output
3. Check the \`get_server_info\` tool for system status
4. Review error messages carefully
5. Test with minimal global templates first

**Useful Tools**:
- \`evaluate_code\`: Test simple expressions
- \`get_context_info\`: Check context state
- \`list_contexts\`: See all active contexts
- \`get_server_info\`: Check server status`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: guide,
            },
          },
        ],
      };
    }
  );
}
