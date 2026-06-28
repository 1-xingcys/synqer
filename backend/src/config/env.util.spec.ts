import { requireEnv } from './env.util';

describe('requireEnv', () => {
  it('returns the value when the variable is set', () => {
    expect(requireEnv('FOO', { FOO: 'bar' })).toBe('bar');
  });

  it('throws when the variable is missing', () => {
    expect(() => requireEnv('FOO', {})).toThrow(
      'Missing required environment variable: FOO',
    );
  });

  it('throws when the variable is an empty string', () => {
    expect(() => requireEnv('FOO', { FOO: '' })).toThrow(
      'Missing required environment variable: FOO',
    );
  });
});
