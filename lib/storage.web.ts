// No web o expo-sqlite exige worker + wasm; localStorage atende o mesmo uso (chave/valor síncrono).
const Storage = {
  getItemSync: (key: string): string | null => localStorage.getItem(key),
  setItemSync: (key: string, value: string): void => localStorage.setItem(key, value),
};

export default Storage;
