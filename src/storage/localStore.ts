import localforage from "localforage";

// Single instance for all local persistence. localforage picks the best
// available backend (IndexedDB, then WebSQL, then localStorage) so data
// survives offline and across PWA installs.
export const localStore = localforage.createInstance({
  name: "medisc",
  storeName: "app",
  description: "Local application data for Medisc.",
});

export async function getItem<T>(key: string): Promise<T | null> {
  return localStore.getItem<T>(key);
}

export async function setItem<T>(key: string, value: T): Promise<T> {
  return localStore.setItem<T>(key, value);
}

export async function removeItem(key: string): Promise<void> {
  return localStore.removeItem(key);
}
