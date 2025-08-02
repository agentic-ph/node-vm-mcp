# MCP Server Implementation Rules

## Tool Development Guidelines

1. **Tool Structure**: Each tool should follow the MCP tool specification
2. **Parameter Validation**: Use Zod schemas for all input validation
3. **Error Responses**: Return user-friendly error messages
4. **Documentation**: Include clear descriptions and examples for each tool
5. **Performance**: Implement caching for frequently accessed data

## Required Tools Implementation Order

Follow the phases outlined in project.md:

### Phase 1: Core Infrastructure

1. **Basic MCP Server**: Set up the foundational MCP server structure
2. **VM Context Manager**: Implement VM context creation and management
3. **VM Execution Service**: Define the execution service for running JavaScript

### Phase 2: VM Tools

1. **Context Management Tools**:
   - `create_context` - Create new isolated VM contexts
   - `list_contexts` - List all active VM contexts
   - `get_context_info` - Get detailed information about a context
   - `destroy_context` - Clean up and remove VM contexts

2. **Execution Tools**:
   - `run_script` - Execute JavaScript code in VM contexts
   - `evaluate_code` - Evaluate JavaScript expressions
   - `get_server_info` - Get server configuration and status

### Phase 3: Security and Monitoring

1. **Security Features**:
   - Timeout enforcement for all executions
   - Memory monitoring and limits
   - Context isolation validation
   - Global template safety

2. **Advanced Features**:
   - Console output capture
   - Error handling and reporting
   - Performance monitoring

## VM Security Standards

- **Context Isolation**: Complete separation between VM contexts
- **Timeout Controls**: Configurable execution timeouts with hard limits
- **Memory Monitoring**: Track and limit memory usage per context
- **Safe Globals**: Controlled access to Node.js APIs through templates
- **Error Boundaries**: Comprehensive error handling for all VM operations

## Response Format Standards

- **Success**: Return structured data matching TypeScript interfaces
- **Errors**: Return clear error messages with appropriate context
- **Empty Results**: Return empty arrays instead of null/undefined
- **Consistency**: Maintain consistent response structure across all tools

## Security Requirements

- **Input Validation**: Validate all parameters before processing
- **Output Sanitization**: Sanitize all data returned to clients
- **Execution Limits**: Enforce timeout and memory limits
- **Context Management**: Proper cleanup and resource management
- **Error Information**: Don't expose internal system details in errors

## Resource Implementation

- **Static Resources**: Provide access to server configuration and status
- **Dynamic Resources**: Support context-specific queries
- **VM Resources**: Enable access to context information and execution history
- **Monitoring**: Real-time monitoring of VM contexts and performance

## Prompt Guidelines

- **Common Operations**: Create prompts for frequent VM operations
- **Context Management**: Implement guided context creation and management
- **Code Execution**: Add prompts for safe code execution patterns
- **Examples**: Include usage examples in all prompts
