const STORAGE_KEY = 'zhichang_qingxing_ds_key';

export function getDeepseekKey(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
    return '';
  } catch {
    return '';
  }
}

export function saveDeepseekKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } catch {}
}
