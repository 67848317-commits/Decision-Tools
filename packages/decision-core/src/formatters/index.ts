export const DEFAULT_LOCALE = 'en-US' as const;
export const DEFAULT_CURRENCY_SYMBOL = '$' as const;

export interface FormatNumberOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

export interface FormatCurrencyOptions extends FormatNumberOptions {
  currencySymbol?: string;
}

/**
 * Deterministic numeric formatter defaulting explicitly to `en-US` so OS or
 * runtime ICU locale settings never alter calculation summaries or tests.
 */
export function formatNumber(
  value: number,
  options: FormatNumberOptions = {}
): string {
  const {
    locale = DEFAULT_LOCALE,
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping = true,
  } = options;

  const safeValue = Object.is(value, -0) ? 0 : value;

  return new Intl.NumberFormat(locale, {
    useGrouping,
    ...(minimumFractionDigits !== undefined ? { minimumFractionDigits } : {}),
    ...(maximumFractionDigits !== undefined ? { maximumFractionDigits } : {}),
  }).format(safeValue);
}

/**
 * Formats a USD amount deterministically using the `en-US` locale by default.
 * Changing `currencySymbol` only affects display formatting, never conversion.
 */
export function formatCurrency(
  value: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    currencySymbol = DEFAULT_CURRENCY_SYMBOL,
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    useGrouping = true,
  } = options;

  const safeValue = Object.is(value, -0) ? 0 : value;
  const isNegative = safeValue < 0;
  const formattedAbs = formatNumber(Math.abs(safeValue), {
    locale,
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  });

  return isNegative
    ? `-${currencySymbol}${formattedAbs}`
    : `${currencySymbol}${formattedAbs}`;
}

/**
 * Preserves the legacy inline currency pattern (`$1,234` / `$-1,234`) used inside
 * calculator `summaryText` outputs while enforcing an explicit `en-US` locale.
 */
export function formatSummaryDollar(
  value: number,
  locale: string = DEFAULT_LOCALE
): string {
  return `$${formatNumber(value, { locale })}`;
}

export function formatFixedDecimal(value: number, digits = 2): string {
  const safeValue = Object.is(value, -0) ? 0 : value;
  return safeValue.toFixed(digits);
}
