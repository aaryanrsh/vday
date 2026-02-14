// Mock DOM elements for testing
global.document = {
  getElementById: jest.fn(),
  addEventListener: jest.fn(),
  createElement: jest.fn(),
  querySelector: jest.fn()
};

global.window = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: jest.fn()
};
