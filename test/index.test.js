const { greet } = require('../src/index');

test('greet returns greeting with name', () => {
  expect(greet('Alice')).toBe('Hello, Alice');
});
