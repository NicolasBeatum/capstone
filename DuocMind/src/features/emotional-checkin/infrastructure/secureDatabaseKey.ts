export interface SecureKeyStorage {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}

export async function getOrCreateSecureDatabaseKey(
  storage: SecureKeyStorage,
  generateKey: () => string,
  storageKey: string,
): Promise<string> {
  const existingKey = await storage.getItemAsync(storageKey);
  if (existingKey) return existingKey;

  const newKey = generateKey();
  if (!/^[a-f0-9]{64}$/i.test(newKey)) {
    throw new Error('La clave de la base de datos debe contener 256 bits aleatorios en hexadecimal.');
  }

  await storage.setItemAsync(storageKey, newKey);
  return newKey;
}