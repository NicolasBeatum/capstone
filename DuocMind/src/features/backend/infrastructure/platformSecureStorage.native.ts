import * as SecureStore from 'expo-secure-store';

import { createSecureAuthStorage } from './secureAuthStorage';

export const platformAuthStorage = createSecureAuthStorage(SecureStore);

export const platformSecureKeyValueStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  deleteItem: (key: string) => SecureStore.deleteItemAsync(key),
};