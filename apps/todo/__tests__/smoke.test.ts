import { describe, expect, test } from 'vitest';

describe('smoke test', () => {
  test('vitest is configured correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('environment is jsdom', () => {
    expect(typeof window).toBe('object');
  });
});