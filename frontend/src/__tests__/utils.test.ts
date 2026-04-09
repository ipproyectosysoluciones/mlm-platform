/**
 * @fileoverview Utility Functions Unit Tests
 * @description Tests for utility functions
 * @module utils.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cn } from '../utils/cn';

// Test data for formatters
const mockDate = new Date('2024-01-15T12:30:00Z');
const mockDateString = '2024-01-15';

describe('cn utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });

  it('should handle conditional classes', () => {
    const showBar = true;
    const showBaz = false;
    const result = cn('foo', showBar && 'bar', showBaz && 'baz');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
    expect(result).not.toContain('baz');
  });

  it('should handle array inputs', () => {
    const result = cn(['foo', 'bar']);
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });

  it('should handle object inputs', () => {
    const result = cn({ foo: true, bar: false });
    expect(result).toContain('foo');
    expect(result).not.toContain('bar');
  });

  it('should handle mixed inputs', () => {
    const result = cn('foo', ['bar', 'baz'], { qux: true });
    expect(result).toContain('foo');
    expect(result).toContain('bar');
    expect(result).toContain('baz');
    expect(result).toContain('qux');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle null and undefined', () => {
    const result = cn('foo', null, undefined, 'bar');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
  });

  it('should handle nested arrays', () => {
    const result = cn(['foo', ['bar', 'baz']]);
    expect(result).toContain('foo');
    expect(result).toContain('bar');
    expect(result).toContain('baz');
  });

  it('should resolve tailwind conflicts (last class wins)', () => {
    // Test with conflicting Tailwind classes
    const result = cn('p-2 p-4', 'm-2 m-4');
    expect(result).toContain('p-4');
    expect(result).toContain('m-4');
  });

  it('should handle string numbers', () => {
    const result = cn('foo', 0, 1, 'bar');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
    expect(result).not.toContain('0');
  });
});

describe('Formatters', () => {
  // Currency formatter tests
  describe('currency', () => {
    it('should format USD currency', () => {
      const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount);
      };

      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format different currencies', () => {
      const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount);
      };

      // Check that formatCurrency doesn't throw and returns formatted string
      expect(formatCurrency(100, 'EUR')).toBeTruthy();
      expect(formatCurrency(100, 'GBP')).toBeTruthy();
    });

    it('should handle negative amounts', () => {
      const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount);
      };

      expect(formatCurrency(-100)).toContain('-');
    });
  });

  // Date formatter tests
  describe('date', () => {
    it('should format dates', () => {
      const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(d);
      };

      expect(formatDate(mockDate)).toMatch(/Jan/i);
      expect(formatDate(mockDate)).toMatch(/15/);
      expect(formatDate(mockDate)).toMatch(/2024/);
    });

    it('should handle string dates', () => {
      const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(d);
      };

      expect(formatDate(mockDateString)).toMatch(/Jan/);
    });
  });

  // Relative time formatter tests
  describe('relativeTime', () => {
    it('should format relative time', () => {
      const formatRelativeTime = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 30) return `${diffDays}d ago`;
        return d.toLocaleDateString();
      };

      // Test with a recent date
      const recentDate = new Date(Date.now() - 3600000); // 1 hour ago
      expect(formatRelativeTime(recentDate)).toMatch(/1h ago/);
    });
  });
});

describe('Validation Helpers', () => {
  describe('email validation', () => {
    it('should validate email format', () => {
      const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('password validation', () => {
    it('should validate password strength', () => {
      const validatePassword = (password: string) => {
        const errors: string[] = [];

        if (password.length < 8) {
          errors.push('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
          errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
          errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
          errors.push('Password must contain at least one number');
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      };

      expect(validatePassword('Password1').isValid).toBe(true);
      expect(validatePassword('weak').isValid).toBe(false);
      expect(validatePassword('alllower1').isValid).toBe(false);
      expect(validatePassword('ALLUPPER1').isValid).toBe(false);
      expect(validatePassword('NoNumbers').isValid).toBe(false);
    });
  });

  describe('referral code validation', () => {
    it('should validate referral code format', () => {
      const isValidReferralCode = (code: string) => {
        // Typically 6-10 alphanumeric characters
        const codeRegex = /^[A-Z0-9]{6,10}$/i;
        return codeRegex.test(code);
      };

      expect(isValidReferralCode('ABC123')).toBe(true);
      expect(isValidReferralCode('abcd12')).toBe(true);
      expect(isValidReferralCode('123456')).toBe(true);
      expect(isValidReferralCode('AB')).toBe(false); // Too short
      expect(isValidReferralCode('abc@123')).toBe(false); // Invalid chars
    });
  });

  describe('phone validation', () => {
    it('should validate phone number format', () => {
      const isValidPhone = (phone: string) => {
        // E.164 format or common formats
        const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
        return phoneRegex.test(phone);
      };

      expect(isValidPhone('+1234567890')).toBe(true);
      expect(isValidPhone('123-456-7890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
    });
  });

  describe('amount validation', () => {
    it('should validate amount', () => {
      const isValidAmount = (amount: number, min = 0, max = 1000000) => {
        return !isNaN(amount) && amount >= min && amount <= max;
      };

      expect(isValidAmount(100)).toBe(true);
      expect(isValidAmount(0)).toBe(true);
      expect(isValidAmount(-1)).toBe(false);
      expect(isValidAmount(1000001)).toBe(false);
      expect(isValidAmount(NaN)).toBe(false);
    });
  });
});

describe('Helper Functions', () => {
  describe('object manipulation', () => {
    it('should pick specific keys from object', () => {
      const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
        const result = {} as Pick<T, K>;
        keys.forEach((key) => {
          if (key in obj) {
            result[key] = obj[key];
          }
        });
        return result;
      };

      const obj = { a: 1, b: 2, c: 3 };
      const picked = pick(obj, ['a', 'c']);

      expect(picked).toEqual({ a: 1, c: 3 });
      expect(picked).not.toHaveProperty('b');
    });

    it('should omit specific keys from object', () => {
      const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
        const result = { ...obj };
        keys.forEach((key) => {
          delete result[key];
        });
        return result;
      };

      const obj = { a: 1, b: 2, c: 3 };
      const omitted = omit(obj, ['b']);

      expect(omitted).toEqual({ a: 1, c: 3 });
      expect(omitted).not.toHaveProperty('b');
    });
  });

  describe('array manipulation', () => {
    it('should group array by key', () => {
      const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> => {
        return arr.reduce(
          (result, item) => {
            const groupKey = String(item[key]);
            if (!result[groupKey]) {
              result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
          },
          {} as Record<string, T[]>
        );
      };

      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];

      const grouped = groupBy(items, 'type');

      expect(grouped.a).toHaveLength(2);
      expect(grouped.b).toHaveLength(1);
    });
  });

  describe('string manipulation', () => {
    it('should truncate string', () => {
      const truncate = (str: string, maxLength: number) => {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - 3) + '...';
      };

      expect(truncate('hello', 10)).toBe('hello');
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('should capitalize string', () => {
      const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('')).toBe('');
    });
  });
});
