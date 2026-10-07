const key = 'nexus.favorites.v1';

export function readFavorites(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id): id is string =>
      typeof id === 'string' && id.length > 0 && id.length < 256
    ))].slice(0, 10000);
  } catch {
    return [];
  }
}

export function writeFavorites(ids: string[]): void {
  localStorage.setItem(key, JSON.stringify(ids));
}
