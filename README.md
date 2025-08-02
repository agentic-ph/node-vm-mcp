# Node VM MCP Server

A powerful Model Context Protocol (MCP) server that provides secure JavaScript execution in isolated VM contexts with configurable globals, timeout controls, and comprehensive safety features.

## 🚀 Features

- **Isolated VM Execution**: Run JavaScript code in completely isolated Node.js VM contexts
- **Security Controls**: Built-in timeout protection, memory monitoring, and restricted access patterns
- **Configurable Globals**: Safe global templates for console, timers, crypto, and more
- **Memory Management**: Automatic memory monitoring and cleanup with configurable limits
- **Error Handling**: Comprehensive error handling with detailed debugging information
- **TypeScript**: Full type safety and excellent developer experience

## 🛡️ Security Features

- **Execution Timeouts**: Configurable timeouts (default: 5s, max: 30s)
- **Memory Limits**: Per-context memory monitoring (default: 128MB)
- **Restricted Patterns**: Automatic blocking of dangerous operations (require, eval, etc.)
- **Context Isolation**: Complete isolation between VM contexts
- **Safe Globals**: Controlled access to Node.js APIs through templates

## 📦 Installation

### NPM (Recommended)

```bash
npm install -g node-vm-mcp
```

### From Source

```bash
git clone https://github.com/your-org/node-vm-mcp.git
cd node-vm-mcp
npm install
npm run build
```

## 🔧 Configuration

### Environment Variables

```bash
# Execution limits
DEFAULT_TIMEOUT=5000        # Default timeout in milliseconds
MAX_TIMEOUT=30000          # Maximum allowed timeout
MAX_CONTEXTS=100           # Maximum concurrent contexts

# Memory settings
MAX_MEMORY_MB=128          # Memory limit per context
ENABLE_MEMORY_MONITORING=true

# Features
ENABLE_CONSOLE_CAPTURE=true
LOG_LEVEL=info
```

### Claude Desktop Configuration

Add the VM MCP server to your Claude Desktop configuration:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "node-vm": {
      "command": "npx",
      "args": ["node-vm-mcp"],
      "env": {
        "DEFAULT_TIMEOUT": "5000",
        "MAX_TIMEOUT": "30000",
        "MAX_CONTEXTS": "100",
        "ENABLE_CONSOLE_CAPTURE": "true"
      }
    }
  }
}
```

### VS Code Configuration

```json
{
  "mcpServers": [
    {
      "name": "node-vm",
      "command": "npx",
      "args": ["node-vm-mcp"],
      "cwd": "${workspaceFolder}",
      "env": {
        "DEFAULT_TIMEOUT": "5000",
        "MAX_TIMEOUT": "30000"
      }
    }
  ]
}
```

### Development Setup

```json
{
  "mcpServers": {
    "node-vm-dev": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/node-vm-mcp",
      "env": {
        "LOG_LEVEL": "debug",
        "DEFAULT_TIMEOUT": "10000"
      }
    }
  }
}
```

### Docker Configuration

```json
{
  "mcpServers": {
    "node-vm-docker": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--env",
        "DEFAULT_TIMEOUT=5000",
        "--env",
        "MAX_CONTEXTS=50",
        "--env",
        "LOG_LEVEL=info",
        "node-vm-mcp:latest"
      ]
    }
  }
}
```

## 🚀 Quick Start

### 1. Create a VM Context

```json
{
  "tool": "create_context",
  "arguments": {
    "contextId": "my-context",
    "name": "My Test Context",
    "globalTemplates": ["console", "timers"]
  }
}
```

### 2. Run JavaScript Code

```json
{
  "tool": "run_script",
  "arguments": {
    "code": "console.log('Hello from VM!'); const result = 2 + 2; console.log('Result:', result); result;",
    "contextId": "my-context",
    "timeout": 5000
  }
}
```

### 3. Evaluate Expressions

```json
{
  "tool": "evaluate_code",
  "arguments": {
    "expression": "Math.sqrt(16) + Math.pow(2, 3)",
    "contextId": "my-context"
  }
}
```

## 🛠️ Troubleshooting

**Server Not Starting**

```bash
# Check if the package is installed
npm list -g node-vm-mcp

# Reinstall if needed
npm install -g node-vm-mcp
```

**Permission Issues**

```bash
# On Unix systems, ensure proper permissions
chmod +x $(which node-vm-mcp)
```

**Context Errors**

```bash
# Check server status
# Use the get_server_info tool to see current state
```

**Configuration Issues**

```json
{
  "mcpServers": {
    "node-vm": {
      "command": "npx",
      "args": ["node-vm-mcp"],
      "env": {
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

**Testing the Server**

```bash
# Start the server directly
npx node-vm-mcp

# Or with debug output
LOG_LEVEL=debug npx node-vm-mcp
```

## 🔧 Advanced Usage

#### Global Templates

Configure safe access to Node.js APIs:

```json
{
  "globalTemplates": [
    "console", // console.log, console.error, etc.
    "timers", // setTimeout, setInterval (with limits)
    "crypto", // crypto.randomUUID, crypto.getRandomValues
    "buffer", // Buffer, TextEncoder, TextDecoder
    "url", // URL, URLSearchParams
    "process" // Limited process info (env, version, platform)
  ]
}
```

#### Custom Globals

```json
{
  "globals": {
    "myAPI": {
      "version": "1.0.0",
      "helper": "function() { return 'Hello!'; }"
    }
  }
}
```

## 📚 API Reference

### Tools

#### `create_context`

Create a new isolated VM execution context.

**Parameters:**

- `contextId` (string, required): Unique identifier for the context
- `name` (string, optional): Human-readable name for the context
- `globalTemplates` (string[], optional): Global templates to include
- `globals` (object, optional): Custom global variables
- `options` (object, optional): Additional context options

**Example:**

```json
{
  "contextId": "test-context",
  "name": "Test Environment",
  "globalTemplates": ["console", "timers"],
  "options": {
    "timeout": 10000
  }
}
```

#### `run_script`

Execute JavaScript code in a VM context.

**Parameters:**

- `code` (string, required): JavaScript code to execute
- `contextId` (string, optional): Context to run in (creates new if not specified)
- `timeout` (number, optional): Execution timeout in milliseconds
- `filename` (string, optional): Filename for stack traces
- `displayErrors` (boolean, optional): Include error details in output

**Example:**

```json
{
  "code": "const x = 10; const y = 20; console.log('Sum:', x + y); x + y;",
  "contextId": "test-context",
  "timeout": 5000,
  "filename": "calculation.js"
}
```

**Response:**

```json
{
  "success": true,
  "result": 30,
  "executionTime": 12,
  "contextId": "test-context",
  "consoleOutput": ["Sum: 30"],
  "memoryUsage": {
    "heapUsed": 2.1,
    "heapTotal": 4.2
  }
}
```

#### `evaluate_code`

Evaluate a JavaScript expression and return the result.

**Parameters:**

- `expression` (string, required): JavaScript expression to evaluate
- `contextId` (string, optional): Context to use
- `timeout` (number, optional): Execution timeout

#### `list_contexts`

Get a list of all active VM contexts.

**Parameters:**

- `includeDetails` (boolean, optional): Include detailed context information

#### `get_context_info`

Get detailed information about a specific context.

**Parameters:**

- `contextId` (string, required): Context identifier

#### `destroy_context`

Clean up and remove a VM context.

**Parameters:**

- `contextId` (string, required): Context identifier to destroy

#### `get_server_info`

Get information about the VM server configuration and status.

## 🏗️ Architecture

```
src/
├── index.ts                 # Main MCP server entry point
├── services/               # Core services
│   ├── vm-context-manager.ts
│   └── vm-execution-service.ts
├── tools/                  # MCP tools
│   ├── vm-tools.ts
│   └── index.ts
├── types/                  # TypeScript type definitions
│   └── index.ts
├── utils/                  # Utilities
│   └── errors.ts
├── resources/              # MCP resources
│   └── index.ts
└── prompts/                # MCP prompts
    └── index.ts
```

## 🔒 Security Model

The VM execution environment implements multiple layers of security:

### Execution Limits

- **Timeout Protection**: All code execution has configurable timeouts
- **Memory Monitoring**: Track and limit memory usage per context
- **Context Isolation**: Complete isolation between VM contexts

### Restricted Access

- **Module Loading**: `require()` and `import` statements are blocked
- **Dynamic Evaluation**: `eval()` and `Function()` constructors are restricted
- **Global Access**: Limited access to `process`, `global`, and other Node.js globals
- **File System**: No direct file system access

### Safe Globals

Instead of full Node.js access, use controlled global templates:

- **Console**: Safe logging functions
- **Timers**: setTimeout/setInterval with safety limits
- **Crypto**: Basic cryptographic functions
- **Buffer**: Buffer and text encoding utilities
- **URL**: URL construction and parsing
- **Process**: Limited process information

## 🧪 Development

### Prerequisites

- Node.js 18+
- TypeScript 5+
- npm or yarn

### Setup

```bash
git clone https://github.com/your-org/node-vm-mcp.git
cd node-vm-mcp
npm install

# Development
npm run dev

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/node-vm-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/node-vm-mcp/discussions)
- **Documentation**: [Wiki](https://github.com/your-org/node-vm-mcp/wiki)

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the standard protocol
- [Node.js VM Module](https://nodejs.org/api/vm.html) for the execution environment
- The TypeScript and Node.js communities for excellent tooling
