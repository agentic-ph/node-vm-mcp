# Testing Patterns for MCP Server

## Test Structure

```typescript
// Test file naming: [module].test.ts
describe('VMExecutionTools', () => {
  describe('run_script', () => {
    it('should execute JavaScript code successfully', async () => {
      // Test implementation
    });

    it('should handle execution errors gracefully', async () => {
      // Test implementation
    });
  });
});
```

## Mocking Strategy

```typescript
// Mock VM context manager
const mockVMContextManager = {
  createContext: jest.fn(),
  getContext: jest.fn(),
  destroyContext: jest.fn(),
  listContexts: jest.fn(),
  // ... other methods
};

// Mock MCP server
const mockServer = {
  tool: jest.fn(),
  resource: jest.fn(),
  prompt: jest.fn(),
};
```

## Test Data Factory

```typescript
// Test data factories for consistent test data
const createMockVMContext = (overrides = {}) => ({
  id: 'test-context',
  name: 'Test Context',
  globals: { console: mockConsole },
  createdAt: new Date(),
  executionCount: 0,
  ...overrides,
});

const createMockExecutionResult = (overrides = {}) => ({
  success: true,
  result: 'test result',
  executionTime: 100,
  contextId: 'test-context',
  consoleOutput: ['test output'],
  ...overrides,
});
```

## Integration Test Patterns

```typescript
describe('VM Integration', () => {
  it('should execute real JavaScript code in VM context', async () => {
    const vmService = new VMExecutionService();
    const result = await vmService.runScript('const x = 2 + 2; x');

    expect(result.success).toBe(true);
    expect(result.result).toBe(4);
    expect(result.executionTime).toBeGreaterThan(0);
    expect(result.contextId).toBeDefined();
  });
});
```

## Performance Testing

```typescript
describe('Performance Tests', () => {
  it('should respond within 100ms for simple code execution', async () => {
    const start = Date.now();
    const result = await tool.runScript({ code: '2 + 2' });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('should handle 100 concurrent executions', async () => {
    const promises = Array(100)
      .fill(null)
      .map(() => tool.runScript({ code: 'Math.random()' }));

    const results = await Promise.all(promises);
    expect(results).toHaveLength(100);
    results.forEach((result) => {
      expect(result.success).toBe(true);
    });
  });
});
```

## Error Scenario Testing

```typescript
describe('Error Handling', () => {
  it('should handle execution timeout', async () => {
    const result = await tool.runScript({
      code: 'while(true) {}',
      timeout: 100,
    });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VM_TIMEOUT');
  });

  it('should handle invalid context IDs', async () => {
    const result = await tool.runScript({
      code: '2 + 2',
      contextId: 'invalid-context',
    });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VM_CONTEXT_ERROR');
  });
});
```

## Test Coverage Requirements

- **Unit Tests**: 90%+ coverage for all modules
- **Integration Tests**: Cover all VM execution scenarios
- **Error Scenarios**: Test all error paths
- **Performance Tests**: Critical path performance validation
- **Edge Cases**: Empty results, malformed data, boundary values

## Continuous Testing

```json
// package.json scripts
{
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:coverage": "vitest --coverage",
  "test:integration": "vitest --config vitest.integration.config.js",
  "test:performance": "vitest --config vitest.performance.config.js"
}
```
