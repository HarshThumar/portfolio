// A small JSON Schema subset (type, required, properties, additionalProperties: false,
// items, enum, pattern). Enough for our content files without adding a dependency.
function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function checkObject(schema, value, path, errors) {
  for (const key of schema.required ?? []) {
    if (!(key in value)) errors.push(`${path}: missing "${key}"`);
  }
  for (const [key, child] of Object.entries(value)) {
    const childSchema = schema.properties?.[key];
    if (childSchema) validate(childSchema, child, `${path}.${key}`, errors);
    else if (schema.additionalProperties === false) errors.push(`${path}: unknown key "${key}"`);
  }
}

export function validate(schema, value, path = '$', errors = []) {
  const actual = typeOf(value);
  const typeOk = schema.type === actual || (schema.type === 'number' && actual === 'integer');
  if (schema.type && !typeOk) {
    errors.push(`${path}: expected ${schema.type}, got ${actual}`);
    return errors;
  }
  if (schema.enum && !schema.enum.includes(value))
    errors.push(`${path}: not one of ${schema.enum}`);
  if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
    errors.push(`${path}: does not match ${schema.pattern}`);
  }
  if (actual === 'object') checkObject(schema, value, path, errors);
  if (actual === 'array' && schema.items) {
    value.forEach((item, index) => validate(schema.items, item, `${path}[${index}]`, errors));
  }
  return errors;
}
