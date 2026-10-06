// Phase 7 — shared Prisma mapping primitives.
//
// Money stays integer minor units in the domain. Prisma stores Decimal(p, s)
// columns. Conversion goes through exact decimal strings only — never floats.
//
// Optional `decimal.js`-style verification is unnecessary: Prisma's Decimal
// round-trips losslessly through `toString()`, and domain numbers are
// validated non-negative before writing.

export function toDecimalString(value: number | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Money / quantity values must be finite and non-negative.");
  }
  return String(value);
}

export function fromDecimal(value: { toString(): string } | string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value.toString());
  if (!Number.isFinite(parsed)) throw new Error("Stored decimal value is not a finite number.");
  return parsed;
}

/** Read-side decimal column: Prisma's runtime Decimal exposes an exact `toString()`. */
export type DecimalLike = { toString(): string } | string | number | null;

/** Read-side row shape: a write row with its Decimal columns widened to DecimalLike. */
export type WithDecimalCols<T, K extends keyof T> = Omit<T, K> & { [P in K]: DecimalLike };

/** ISO-8601 string -> Date (validated). */
export function toDate(value: string | undefined): Date | undefined {
  if (value === undefined) return undefined;
  const time = Date.parse(value);
  if (Number.isNaN(time)) throw new Error("Stored timestamp is not a valid ISO-8601 date.");
  return new Date(time);
}

/** Date -> ISO-8601 string. */
export function fromDate(value: Date | string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  return value.toISOString();
}

export function optionalText(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

export function assertId(value: string, label = "id"): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 300) {
    throw new Error(`Invalid ${label}.`);
  }
  return value;
}
