export function validateSchemaFormat(schema: any[]): { isValid: boolean; error?: string } {
  if (!Array.isArray(schema)) {
    return { isValid: false, error: 'Schema must be an array' };
  }

  for (const item of schema) {
    if (!item.id || typeof item.id !== 'string') {
      return { isValid: false, error: 'Each schema item must have a valid id' };
    }
    if (!item.type || typeof item.type !== 'string') {
      return { isValid: false, error: 'Each schema item must have a valid type' };
    }
    if (!item.properties || typeof item.properties !== 'object') {
      return { isValid: false, error: 'Each schema item must have properties object' };
    }
  }

  return { isValid: true };
}
