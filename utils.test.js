import { parseSize, calculateAverage } from "./utils.js";

test("parseSize parses valid size strings", () => {
  expect(parseSize("3x4")).toEqual({ rows: 3, cols: 4 });
  expect(parseSize("2 x 6")).toEqual({ rows: 2, cols: 6 });
});

test("calculateAverage returns correct average", () => {
  expect(calculateAverage([10, 20, 30])).toBe(20);
});
