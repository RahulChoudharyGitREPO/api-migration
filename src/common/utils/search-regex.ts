export function generateSearchRegex(search: string): RegExp {
  // Escape special regex characters
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escapedSearch, 'i');
}
