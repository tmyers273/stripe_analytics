import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../services/passwordService';

describe('passwordService', () => {
  it('hashes and verifies a password successfully', async () => {
    const password = 'Sup3r$ecure!';
    const hash = await hashPassword(password);

    expect(hash).toBeTypeOf('string');
    expect(hash).toMatch(/^[$]argon2id/);

    const matches = await verifyPassword(password, hash);
    expect(matches).toBe(true);
  });

  it('fails verification when password does not match', async () => {
    const hash = await hashPassword('initialPassword');
    const matches = await verifyPassword('wrongPassword', hash);

    expect(matches).toBe(false);
  });
});
