import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Register all VM-related resources with the MCP server
 */
export function registerResources(server: McpServer): void {
  // VM Context Templates Resource
  server.resource(
    'vm-context-templates',
    'Available global templates for VM contexts',
    async () => ({
      contents: [
        {
          uri: 'vm://templates',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              templates: [
                {
                  name: 'console',
                  description: 'Console logging functions (log, error, warn, info, debug, trace)',
                  globals: ['console'],
                },
                {
                  name: 'timers',
                  description: 'Timer functions with safety limits (setTimeout, setInterval, etc.)',
                  globals: [
                    'setTimeout',
                    'setInterval',
                    'clearTimeout',
                    'clearInterval',
                    'setImmediate',
                    'clearImmediate',
                  ],
                },
                {
                  name: 'crypto',
                  description: 'Basic cryptographic functions (randomUUID, getRandomValues)',
                  globals: ['crypto'],
                },
                {
                  name: 'buffer',
                  description: 'Buffer and text encoding utilities',
                  globals: ['Buffer', 'TextEncoder', 'TextDecoder'],
                },
                {
                  name: 'url',
                  description: 'URL and URLSearchParams constructors',
                  globals: ['URL', 'URLSearchParams'],
                },
                {
                  name: 'process',
                  description: 'Limited process information (env, version, platform, arch)',
                  globals: ['process'],
                },
              ],
            },
            null,
            2
          ),
        },
      ],
    })
  );

  // VM Security Guidelines Resource
  server.resource(
    'vm-security-guidelines',
    'Security guidelines and best practices for VM execution',
    async () => ({
      contents: [
        {
          uri: 'vm://security',
          mimeType: 'text/markdown',
          text: `# VM Security Guidelines

## Execution Limits
- **Default Timeout**: 5 seconds
- **Maximum Timeout**: 30 seconds
- **Memory Limit**: 128MB per context
- **Maximum Contexts**: 100 concurrent contexts

## Restricted Patterns
The following patterns are blocked for security:
- \`require()\` - Module loading
- \`import\` statements - ES module imports
- \`eval()\` - Dynamic code evaluation (unless explicitly enabled)
- \`Function()\` - Function constructor
- \`process.\` - Process object access (except limited info)
- \`global.\` - Global object access
- \`globalThis.\` - Global this access
- \`__dirname\` - Directory name
- \`__filename\` - File name

## Safe Globals
Use global templates to provide safe, limited access to:
- Console logging
- Timer functions (with limits)
- Basic crypto functions
- Buffer utilities
- URL constructors
- Limited process information

## Best Practices
1. Always set appropriate timeouts
2. Use specific global templates instead of full access
3. Monitor memory usage in production
4. Regularly clean up unused contexts
5. Validate all user input before execution
`,
        },
      ],
    })
  );
}
