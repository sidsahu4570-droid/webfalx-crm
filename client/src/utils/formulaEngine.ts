/**
 * Excel-Style Formula Calculation Engine
 * Supports COUNT, COUNTA, SUM, AVERAGE, MIN, MAX, IF, AND, OR, CONCAT, LEFT, RIGHT, MID, UPPER, LOWER, TODAY, DATEDIF, DAYS
 */

export const FormulaEngine = {
  // Count Functions
  COUNT: (arr: any[]): number => {
    return arr.filter((x) => typeof x === 'number' && !isNaN(x)).length;
  },

  COUNTA: (arr: any[]): number => {
    return arr.filter((x) => x !== null && x !== undefined && x !== '').length;
  },

  // Math Functions
  SUM: (numbers: number[]): number => {
    return numbers.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  },

  AVERAGE: (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    const validNums = numbers.map((n) => Number(n) || 0);
    return validNums.reduce((a, b) => a + b, 0) / validNums.length;
  },

  MIN: (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    return Math.min(...numbers.map((n) => Number(n) || 0));
  },

  MAX: (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    return Math.max(...numbers.map((n) => Number(n) || 0));
  },

  // Logic Functions
  IF: <T>(condition: boolean, trueVal: T, falseVal: T): T => {
    return condition ? trueVal : falseVal;
  },

  AND: (...conditions: boolean[]): boolean => {
    return conditions.every(Boolean);
  },

  OR: (...conditions: boolean[]): boolean => {
    return conditions.some(Boolean);
  },

  // Text Functions
  CONCAT: (...strings: string[]): string => {
    return strings.join('');
  },

  LEFT: (str: string, numChars: number): string => {
    if (!str) return '';
    return str.substring(0, numChars);
  },

  RIGHT: (str: string, numChars: number): string => {
    if (!str) return '';
    return str.substring(str.length - numChars);
  },

  MID: (str: string, start: number, length: number): string => {
    if (!str) return '';
    return str.substring(start, start + length);
  },

  UPPER: (str: string): string => {
    return (str || '').toUpperCase();
  },

  LOWER: (str: string): string => {
    return (str || '').toLowerCase();
  },

  // Date Functions
  TODAY: (): string => {
    return new Date().toISOString().split('T')[0];
  },

  DAYS: (endDateStr: string, startDateStr: string): number => {
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  DATEDIF: (startDateStr: string, endDateStr: string, unit: 'D' | 'M' | 'Y' = 'D'): number => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (unit === 'Y') {
      return end.getFullYear() - start.getFullYear();
    } else if (unit === 'M') {
      return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};
