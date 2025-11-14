// Stub for password-vault (not needed for testing)
export class PasswordVault {
  async store(key: string, value: string): Promise<void> {}
  async retrieve(key: string): Promise<string | null> { return null; }
}
