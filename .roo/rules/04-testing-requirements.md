# Testing Requirements for Node VM MCP Server

## Unit Testing Standards

1. **Coverage Target**: Aim for 90%+ code coverage
2. **Test Structure**: Organize tests to mirror source structure
3. **Naming**: Use descriptive test names following pattern: `should_[expected_behavior]_when_[condition]`
4. **Testing Framework**: Use Vitest instead of Jest for faster execution and better TypeScript support

## Test Categories

### VM Context Tests

- Test VM context creation and destruction
- Test context isolation between different VM instances
- Test memory monitoring and cleanup
- Test global template application
- Test context configuration validation

### VM Execution Tests

- Test JavaScript code execution in isolated contexts
- Test timeout enforcement and error handling
- Test console output capture
- Test expression evaluation
- Test security boundary enforcement

### Tool Tests

- Test each tool with valid inputs
- Test tool behavior with invalid inputs
- Test edge cases (empty results, malformed data)
- Test parameter validation
- Test error propagation

### Integration Tests

- Test complete VM execution workflows
- Test tool combinations and context management
- Test performance with multiple concurrent contexts
- Test error recovery mechanisms

## Test Data Requirements

- Use realistic JavaScript code samples for execution tests
- Include edge cases (infinite loops, memory-intensive operations)
- Test with various timeout values and memory limits
- Include tests for different global template combinations

## Performance Testing

- Test response times for each tool
- Test memory usage with large VM contexts
- Test execution timeout accuracy
- Test concurrent context handling

## Test Organization

```
tests/
├── unit/
│   ├── services/
│   │   ├── vm-context-manager.test.ts
│   │   ├── vm-execution-service.test.ts
│   │   └── global-templates.test.ts
│   ├── tools/
│   │   ├── create-context.test.ts
│   │   ├── run-script.test.ts
│   │   ├── evaluate-code.test.ts
│   │   └── context-management.test.ts
│   └── utils/
│       ├── error-handling.test.ts
│       └── validation.test.ts
├── integration/
│   ├── vm-execution-workflows.test.ts
│   └── security-boundaries.test.ts
└── fixtures/
    ├── sample-scripts/
    └── test-contexts/
```

## Continuous Integration

- Run tests on every commit
- Include performance benchmarks in CI
- Generate coverage reports
- Validate against multiple Node.js versions
