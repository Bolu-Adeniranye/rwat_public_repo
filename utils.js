// utils.js

export function parseSize(size) {
  if (!size) return null;

  const parts = size.toLowerCase().split("x");
  if (parts.length !== 2) return null;

  const rows = Number(parts[0].trim());
  const cols = Number(parts[1].trim());

  if (!Number.isInteger(rows) || !Number.isInteger(cols)) return null;
  if ((rows * cols) % 2 !== 0) return null;

  return { rows, cols };
}

export function calculateAverage(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return null;

  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
}
