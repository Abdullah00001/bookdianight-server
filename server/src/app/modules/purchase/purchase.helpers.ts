import { Prisma } from '@prisma/client';

/**
 * Parses a fixed -06:00 ISO input into the existing timestamp wall-clock representation.
 * @param value The date/time string to parse in -06:00 ISO format.
 * @returns The parsed date.
 */
export const parseFixedCstWallClock = (value: string): Date => {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?-06:00$/.exec(
      value
    );
  if (!match) throw new Error('Date/time must use fixed CST offset -06:00');
  const [, year, month, day, hour, minute, second = '0', milliseconds = '0'] =
    match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(milliseconds.padEnd(3, '0'))
    )
  );
};

/**
 * Returns the current wall-clock time in fixed CST (-06:00).
 * This is equivalent to `new Date(Date.now() - 21600000)`.
 * @returns The current wall-clock time in fixed CST (-06:00).
 */
export const currentFixedCstWallClock = (): Date =>
  new Date(Date.now() - 21600000);

/**
 * Calculates the age in years between a birth date and the current wall-clock time.
 * @param birth The birth date.
 * @param now The current wall-clock time (assumed to be in the same time zone as birth).
 * @returns The age in years.
 */
export const calculateAge = (birth: Date, now: Date): number => {
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() &&
      now.getUTCDate() < birth.getUTCDate())
  )
    age -= 1;
  return age;
};

/**
 * Converts a Prisma Decimal to a fixed-point number with 2 decimal places.
 * @param value The Decimal value to convert.
 * @returns The Decimal value as a number with 2 decimal places.
 */
export const decimalNumber = (value: Prisma.Decimal): number =>
  Number(value.toFixed(2));
