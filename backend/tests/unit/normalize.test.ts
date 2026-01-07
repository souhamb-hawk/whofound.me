import { describe, it, expect } from 'vitest';
import { normalizeInput, hashQuery } from '../../src/utils/normalize.js';
import type { SearchRequest } from '../../src/types/index.js';

describe('normalizeInput', () => {
  describe('valid inputs', () => {
    it('should normalize a basic full name', () => {
      const request: SearchRequest = { fullName: 'John Smith' };
      const result = normalizeInput(request);
      
      expect(result.fullName).toBe('John Smith');
      expect(result.city).toBeUndefined();
      expect(result.region).toBeUndefined();
    });

    it('should trim leading and trailing whitespace', () => {
      const request: SearchRequest = { fullName: '  John Smith  ' };
      const result = normalizeInput(request);
      
      expect(result.fullName).toBe('John Smith');
    });

    it('should collapse multiple spaces to single space', () => {
      const request: SearchRequest = { fullName: 'John    Michael   Smith' };
      const result = normalizeInput(request);
      
      expect(result.fullName).toBe('John Michael Smith');
    });

    it('should handle names with multiple parts', () => {
      const request: SearchRequest = { fullName: 'Mary Jane Watson Parker' };
      const result = normalizeInput(request);
      
      expect(result.fullName).toBe('Mary Jane Watson Parker');
    });

    it('should include city and region when provided', () => {
      const request: SearchRequest = {
        fullName: 'John Smith',
        city: 'New York',
        region: 'NY',
      };
      const result = normalizeInput(request);
      
      expect(result.fullName).toBe('John Smith');
      expect(result.city).toBe('New York');
      expect(result.region).toBe('NY');
    });

    it('should normalize city and region', () => {
      const request: SearchRequest = {
        fullName: 'John Smith',
        city: '  Los Angeles  ',
        region: '  CA  ',
      };
      const result = normalizeInput(request);
      
      expect(result.city).toBe('Los Angeles');
      expect(result.region).toBe('CA');
    });

    it('should handle empty city and region as undefined', () => {
      const request: SearchRequest = {
        fullName: 'John Smith',
        city: '',
        region: '',
      };
      const result = normalizeInput(request);
      
      expect(result.city).toBeUndefined();
      expect(result.region).toBeUndefined();
    });
  });

  describe('invalid inputs', () => {
    it('should throw error for single word name', () => {
      const request: SearchRequest = { fullName: 'John' };
      
      expect(() => normalizeInput(request)).toThrow(
        'Full name must contain at least two words'
      );
    });

    it('should throw error for empty name', () => {
      const request: SearchRequest = { fullName: '' };
      
      expect(() => normalizeInput(request)).toThrow(
        'Full name must contain at least two words'
      );
    });

    it('should throw error for whitespace-only name', () => {
      const request: SearchRequest = { fullName: '   ' };
      
      expect(() => normalizeInput(request)).toThrow(
        'Full name must contain at least two words'
      );
    });
  });
});

describe('hashQuery', () => {
  it('should generate a 64-character hex hash', async () => {
    const input = { fullName: 'John Smith' };
    const hash = await hashQuery(input);
    
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it('should generate same hash for same input', async () => {
    const input1 = { fullName: 'John Smith', city: 'New York' };
    const input2 = { fullName: 'John Smith', city: 'New York' };
    
    const hash1 = await hashQuery(input1);
    const hash2 = await hashQuery(input2);
    
    expect(hash1).toBe(hash2);
  });

  it('should generate different hash for different inputs', async () => {
    const input1 = { fullName: 'John Smith' };
    const input2 = { fullName: 'Jane Doe' };
    
    const hash1 = await hashQuery(input1);
    const hash2 = await hashQuery(input2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should be case-insensitive for hashing', async () => {
    const input1 = { fullName: 'John Smith' };
    const input2 = { fullName: 'JOHN SMITH' };
    
    const hash1 = await hashQuery(input1);
    const hash2 = await hashQuery(input2);
    
    expect(hash1).toBe(hash2);
  });

  it('should include optional fields in hash', async () => {
    const input1 = { fullName: 'John Smith' };
    const input2 = { fullName: 'John Smith', city: 'New York' };
    
    const hash1 = await hashQuery(input1);
    const hash2 = await hashQuery(input2);
    
    expect(hash1).not.toBe(hash2);
  });
});

