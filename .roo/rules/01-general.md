# General Rules for Node VM MCP Server Development

## Project Overview

This project implements a Model Context Protocol (MCP) server for executing JavaScript in isolated VM contexts with configurable globals, timeout controls, and comprehensive safety features.

## Core Principles

1. **Security First**: Implement robust sandboxing and execution controls
2. **Type Safety**: Always use TypeScript with strict mode enabled
3. **Performance Focus**: Efficient VM context management and execution
4. **Isolation**: Complete separation between VM contexts
5. **Documentation**: Maintain comprehensive JSDoc comments for all public APIs

## Development Standards

- Use TypeScript for all new code
- Follow the established project structure in `project.md`
- Write unit tests for all functions and tools
- Use descriptive variable and function names
- Add error handling for all VM execution and context management
- Implement proper logging for debugging

## Code Organization

- Keep the modular structure defined in the implementation plan
- Separate concerns: types, services, tools, resources, prompts
- Use consistent naming conventions across all files
- Maintain clear separation between VM execution and MCP implementation

## Testing Requirements

- Unit tests for all tools and services
- Integration tests with VM execution scenarios
- Test error scenarios and edge cases
- Performance testing for VM operations
- Validate all input parameters and responses

## Documentation Standards

- JSDoc comments for all public methods
- README files for each major component
- Usage examples for all tools
- VM security and isolation documentation
- Deployment and setup instructions
