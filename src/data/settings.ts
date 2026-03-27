// Hardcoded DeepSeek API key — stored directly in localStorage
const STORAGE_KEY = 'zhichang_qingxing_ds_key';
const HARDCODED_KEY = 'sk-74cd147ca82245b497ce001f945f5e5d';

export function getDeepseekKey(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || HARDCODED_KEY;
  } catch {
    return HARDCODED_KEY;
  }
}

export function saveDeepseekKey(_key: string): void {
  // key is hardcoded, no need to save
}
