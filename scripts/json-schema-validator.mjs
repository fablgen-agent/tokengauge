function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function resolveReference(root, reference) {
  if (!reference.startsWith("#/")) throw new Error(`Unsupported JSON Schema reference: ${reference}`);
  return reference.slice(2).split("/").reduce((value, segment) => {
    const key = segment.replace(/~1/g, "/").replace(/~0/g, "~");
    return value?.[key];
  }, root);
}

function matchesType(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function formatMatches(value, format) {
  if (format === "date-time") {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
    if (!match) return false;
    const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);
    const offsetHour = offsetHourText === undefined ? 0 : Number(offsetHourText);
    const offsetMinute = offsetMinuteText === undefined ? 0 : Number(offsetMinuteText);
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1] &&
      hour <= 23 && minute <= 59 && second <= 59 && offsetHour <= 23 && offsetMinute <= 59 &&
      Number.isFinite(Date.parse(value));
  }
  if (format === "uri") {
    try {
      const parsed = new URL(value);
      return Boolean(parsed.protocol && parsed.hostname);
    } catch {
      return false;
    }
  }
  throw new Error(`Unsupported JSON Schema format: ${format}`);
}

function validate(schema, value, root, path, errors) {
  if (schema.$ref) {
    const resolved = resolveReference(root, schema.$ref);
    if (!resolved) throw new Error(`Missing JSON Schema reference: ${schema.$ref}`);
    validate(resolved, value, root, path, errors);
    return;
  }

  if (schema.oneOf) {
    const matches = schema.oneOf.filter((branch) => {
      const branchErrors = [];
      validate(branch, value, root, path, branchErrors);
      return branchErrors.length === 0;
    });
    if (matches.length !== 1) errors.push(`${path} must match exactly one allowed shape`);
    return;
  }

  if (schema.const !== undefined && !sameValue(value, schema.const)) {
    errors.push(`${path} must equal ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.some((entry) => sameValue(value, entry))) {
    errors.push(`${path} is not an allowed value`);
  }
  if (schema.type && !matchesType(value, schema.type)) {
    errors.push(`${path} must be ${schema.type}`);
    return;
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path} is too short`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path} does not match ${schema.pattern}`);
    if (schema.format && !formatMatches(value, schema.format)) errors.push(`${path} is not a valid ${schema.format}`);
  }

  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${path} must be at least ${schema.minimum}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path} has too few items`);
    if (schema.uniqueItems) {
      const serialized = value.map((entry) => JSON.stringify(entry));
      if (new Set(serialized).size !== serialized.length) errors.push(`${path} must contain unique items`);
    }
    if (schema.items) value.forEach((entry, index) => validate(schema.items, entry, root, `${path}[${index}]`, errors));
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const properties = schema.properties ?? {};
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) errors.push(`${path}.${key} is required`);
    }
    for (const [key, entry] of Object.entries(value)) {
      if (properties[key]) validate(properties[key], entry, root, `${path}.${key}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${path}.${key} is not allowed`);
    }
  }
}

export function jsonSchemaErrors(schema, value) {
  const errors = [];
  validate(schema, value, schema, "$", errors);
  return errors;
}

export function assertJsonSchema(schema, value) {
  const errors = jsonSchemaErrors(schema, value);
  if (errors.length) throw new Error(`JSON Schema validation failed:\n${errors.join("\n")}`);
}
