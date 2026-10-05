function powerOfTen(exponent: number): bigint {
  return BigInt(10) ** BigInt(exponent);
}

function divideRounded(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / BigInt(2)) / denominator;
}

function decimalToScaledInteger(value: number, precision: number): bigint {
  const raw = value.toString().toLowerCase();
  const [coefficient, exponentText] = raw.split("e");
  const exponent = exponentText ? Number(exponentText) : 0;
  const [whole, fraction = ""] = coefficient.split(".");
  const digits = BigInt(`${whole}${fraction}`);
  const shift = precision - fraction.length + exponent;
  return shift >= 0
    ? digits * powerOfTen(shift)
    : divideRounded(digits, powerOfTen(-shift));
}

function formatMinorUnits(value: bigint, currency: string): string {
  const isNegative = value < BigInt(0);
  const positive = isNegative ? -value : value;
  const major = positive / BigInt(100);
  const minor = (positive % BigInt(100)).toString().padStart(2, "0");
  return `${currency} ${isNegative ? "-" : ""}${major}.${minor}`;
}

export function sumCurrencyAmounts(values: Array<{ amount?: number; currency?: string }>): string[] {
  const totals = new Map<string, bigint>();
  for (const entry of values) {
    if (entry.amount === undefined) continue;
    const currency = entry.currency || "USD";
    totals.set(currency, (totals.get(currency) ?? BigInt(0)) + decimalToScaledInteger(entry.amount, 2));
  }
  return [...totals.entries()].map(([currency, amount]) => formatMinorUnits(amount, currency));
}

export function sumCurrencyValues(values: Array<string | undefined>): string[] {
  const totals = new Map<string, bigint>();
  for (const value of values) {
    if (!value) continue;
    const match = /^([A-Z]{3}) (-?)(\d+)\.(\d{2})$/.exec(value);
    if (!match) continue;
    const [, currency, sign, major, minor] = match;
    const amount = BigInt(major) * BigInt(100) + BigInt(minor);
    totals.set(currency, (totals.get(currency) ?? BigInt(0)) + (sign ? -amount : amount));
  }
  return [...totals.entries()].map(([currency, amount]) => formatMinorUnits(amount, currency));
}

export function calculateDealValue(quantityMt?: number, pricePerMt?: number, currency = "USD"): string | undefined {
  if (quantityMt === undefined || pricePerMt === undefined) return undefined;
  const quantityMilliMt = decimalToScaledInteger(quantityMt, 3);
  const priceCentsPerMt = decimalToScaledInteger(pricePerMt, 2);
  const valueCents = divideRounded(quantityMilliMt * priceCentsPerMt, BigInt(1000));
  return formatMinorUnits(valueCents, currency);
}

export function calculateEstimatedCommission({
  quantityMt,
  pricePerMt,
  percentage,
  fixedAmount,
  currency = "USD",
}: {
  quantityMt?: number;
  pricePerMt?: number;
  percentage?: number;
  fixedAmount?: number;
  currency?: string;
}): string | undefined {
  if (fixedAmount !== undefined) return formatMinorUnits(decimalToScaledInteger(fixedAmount, 2), currency);
  if (percentage === undefined || quantityMt === undefined || pricePerMt === undefined) return undefined;
  const valueCents = decimalToScaledInteger(quantityMt, 3) * decimalToScaledInteger(pricePerMt, 2);
  const estimatedCents = divideRounded(valueCents * decimalToScaledInteger(percentage, 4), BigInt(1000) * BigInt(1_000_000));
  return formatMinorUnits(estimatedCents, currency);
}

export function toMinorUnits(value: number | undefined): bigint | undefined {
  return value === undefined ? undefined : decimalToScaledInteger(value, 2);
}
