// Stub for password-vault (not needed for testing)
export class PasswordVault {
  async store(_key: string, _value: string): Promise<void> {}
  async retrieve(_key: string): Promise<string | null> { return null; }
}
