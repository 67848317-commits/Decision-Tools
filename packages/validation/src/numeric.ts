import type {
  NumericFieldRule,
  ParsedNumericInput,
  ValidationErrorCode,
  ValidationIssue,
} from '@decision-tools/shared-types';

const STRICT_NUMERIC_REGEX = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Strictly parses raw numeric input without falsy coercion (`|| DEFAULT`),
 * preserving legitimate `0` values while distinguishing empty and invalid inputs.
 */
export function parseNumericInput(raw: unknown): ParsedNumericInput {
  if (raw === null || raw === undefined) {
    return { status: 'empty', value: null, sign: null, raw: '' };
  }

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      return { status: 'invalid', value: null, sign: null, raw: String(raw) };
    }
    const normalized = Object.is(raw, -0) ? 0 : raw;
    return {
      status: 'valid',
      value: normalized,
      sign: normalized === 0 ? 'zero' : normalized > 0 ? 'positive' : 'negative',
      raw: String(normalized),
    };
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return { status: 'empty', value: null, sign: null, raw };
    }
    if (!STRICT_NUMERIC_REGEX.test(trimmed)) {
      return { status: 'invalid', value: null, sign: null, raw };
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return { status: 'invalid', value: null, sign: null, raw };
    }
    const normalized = Object.is(parsed, -0) ? 0 : parsed;
    return {
      status: 'valid',
      value: normalized,
      sign: normalized === 0 ? 'zero' : normalized > 0 ? 'positive' : 'negative',
      raw,
    };
  }

  return { status: 'invalid', value: null, sign: null, raw: String(raw) };
}

/**
 * Converts a raw input into a finite number (preserving `0` and normalizing `-0` -> `0`)
 * or `Number.NaN` when empty/invalid, so shared validators reject missing or
 * non-numeric inputs instead of substituting defaults.
 */
export function parseNumericFieldOrNaN(raw: unknown): number {
  const parsed = parseNumericInput(raw);
  return parsed.status === 'valid' && parsed.value !== null ? parsed.value : Number.NaN;
}

export interface FieldValidationResult {
  value: number | null;
  issue: ValidationIssue | null;
}

function makeIssue(
  field: string,
  code: ValidationErrorCode,
  message: string
): ValidationIssue {
  return { field, code, message };
}

/**
 * Validates a single raw numeric field against explicit rules without clamping
 * or silently replacing missing/invalid values with defaults.
 */
export function validateNumericField(
  field: string,
  raw: unknown,
  rule: NumericFieldRule
): FieldValidationResult {
  const parsed = parseNumericInput(raw);

  if (parsed.status === 'empty') {
    if (rule.required !== false) {
      return {
        value: null,
        issue: makeIssue(field, 'REQUIRED', `${rule.label} is required.`),
      };
    }
    return { value: null, issue: null };
  }

  if (parsed.status === 'invalid' || parsed.value === null) {
    return {
      value: null,
      issue: makeIssue(field, 'INVALID_NUMBER', `${rule.label} must be a valid number.`),
    };
  }

  const val = parsed.value;

  if (!rule.allowNegative && val < 0) {
    return {
      value: null,
      issue: makeIssue(
        field,
        'NEGATIVE_NOT_ALLOWED',
        `${rule.label} cannot be negative.`
      ),
    };
  }

  if (rule.exclusiveMin !== undefined && val <= rule.exclusiveMin) {
    const code: ValidationErrorCode =
      rule.exclusiveMin === 0 ? 'MUST_BE_POSITIVE' : 'BELOW_MIN';
    const message =
      rule.exclusiveMin === 0
        ? `${rule.label} must be greater than zero.`
        : `${rule.label} must be greater than ${rule.exclusiveMin}.`;
    return { value: null, issue: makeIssue(field, code, message) };
  }

  if (rule.min !== undefined && val < rule.min) {
    return {
      value: null,
      issue: makeIssue(
        field,
        'BELOW_MIN',
        `${rule.label} must be at least ${rule.min}.`
      ),
    };
  }

  if (rule.max !== undefined && val > rule.max) {
    return {
      value: null,
      issue: makeIssue(
        field,
        'ABOVE_MAX',
        `${rule.label} cannot exceed ${rule.max}.`
      ),
    };
  }

  if (rule.integer && !Number.isInteger(val)) {
    return {
      value: null,
      issue: makeIssue(
        field,
        'MUST_BE_INTEGER',
        `${rule.label} must be a whole number.`
      ),
    };
  }

  return { value: val, issue: null };
}

export interface ParsedFieldMapResult<TKeys extends string> {
  valid: boolean;
  values: Partial<Record<TKeys, number>>;
  errors: Record<string, string>;
  issues: ValidationIssue[];
}

/**
 * Parses and validates a keyed map of raw inputs (e.g. HTML string inputs or
 * controlled React text inputs) without coercing `0` to defaults.
 */
export function parseAndValidateFields<TKeys extends string>(
  fields: Record<TKeys, { raw: unknown; rule: NumericFieldRule }>
): ParsedFieldMapResult<TKeys> {
  const values: Partial<Record<TKeys, number>> = {};
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  for (const key of Object.keys(fields) as TKeys[]) {
    const spec = fields[key];
    const result = validateNumericField(key, spec.raw, spec.rule);
    if (result.issue) {
      errors[key] = result.issue.message;
      issues.push(result.issue);
    } else if (result.value !== null) {
      values[key] = result.value;
    }
  }

  return {
    valid: issues.length === 0,
    values,
    errors,
    issues,
  };
}
