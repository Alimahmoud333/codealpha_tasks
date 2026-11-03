/*
 * Money maths is done in integer cents to avoid floating point errors
 * (0.1 + 0.2 !== 0.3). Values are converted back to decimals only at the edge.
 */
export const toCents = (value) => Math.round(Number(value) * 100);
export const fromCents = (cents) => cents / 100;
