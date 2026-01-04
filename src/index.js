function greet(name) {
  return `Hello, ${name || 'world'}`;
}

module.exports = { greet };
