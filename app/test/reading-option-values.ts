// These legacy controls displayed option text but their existing keys require
// letters. Keep other tests' established answer formats unchanged.
const letterQuestions: Record<number, readonly number[]> = {
  11: [33, 34, 35],
  14: [13, 25, 26],
  15: [18, 19, 20, 21, 22, 37, 38, 39, 40],
  16: [12, 13, 14],
  17: [14, 15, 16, 17, 18, 24, 25, 26, 36, 37, 38, 39, 40],
};

export function readingOptionValue(test: number, number: number, text: string, index: number) {
  return letterQuestions[test]?.includes(number) ? String.fromCharCode(65 + index) : text;
}

export function normalizeReadingOption(test: number, number: number, value: string, options: readonly string[]) {
  const index = options.indexOf(value);
  return index < 0 ? value : readingOptionValue(test, number, value, index);
}
