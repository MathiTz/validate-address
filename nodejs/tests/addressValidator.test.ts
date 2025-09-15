import { validateAddress } from '../src/addressValidator';
import { AddressValidationResult } from '../src/types';

describe('Address Validator', () => {
  test('validates complete valid address', () => {
    const result: AddressValidationResult = validateAddress('123 Main Street, Anytown, CA 12345');

    expect(result.status).toBe('valid');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.validated?.streetNumber).toBe('123');
    expect(result.validated?.streetName).toBe('Main Street');
    expect(result.validated?.city).toBe('Anytown');
    expect(result.validated?.state).toBe('CA');
    expect(result.validated?.zipCode).toBe('12345');
  });

  test('corrects abbreviated street types', () => {
    const result: AddressValidationResult = validateAddress('456 Oak St, Springfield, IL 62701');

    expect(result.status).toBe('corrected');
    expect(result.validated?.streetName).toBe('Oak Street');
    expect(result.corrections).toContain('Street type abbreviation expanded');
  });

  test('handles full state names', () => {
    const result: AddressValidationResult = validateAddress('789 Pine Ave, Los Angeles, California 90210');

    expect(result.validated?.state).toBe('CA');
  });

  test('expands direction abbreviations', () => {
    const result: AddressValidationResult = validateAddress('100 N Main St, Chicago, IL 60601');

    expect(result.status).toBe('corrected');
    expect(result.validated?.streetName).toBe('North Main Street');
    expect(result.corrections).toEqual(expect.arrayContaining(['Direction abbreviations expanded']));
  });

  test('handles partial addresses', () => {
    const result: AddressValidationResult = validateAddress('Main Street, Anytown');

    expect(result.status).toBe('valid');
    expect(result.validated?.streetName).toBe('Main Street');
    expect(result.validated?.city).toBe('Anytown');
    expect(result.validated?.streetNumber).toBeNull();
    expect(result.confidence).toBeLessThan(0.8);
  });

  test('handles missing components gracefully', () => {
    const result: AddressValidationResult = validateAddress('123 Main St');

    expect(result.validated?.streetNumber).toBe('123');
    expect(result.validated?.streetName).toBe('Main Street');
    expect(result.validated?.city).toBeNull();
    expect(result.confidence).toBeLessThan(0.7);
  });

  test('handles extended zip codes', () => {
    const result: AddressValidationResult = validateAddress('123 Main St, Anytown, CA 12345-6789');

    expect(result.validated?.zipCode).toBe('12345-6789');
  });

  test('returns unverifiable for empty input', () => {
    const result: AddressValidationResult = validateAddress('');

    expect(result.status).toBe('unverifiable');
    expect(result.confidence).toBe(0.0);
    expect(result.validated).toBeNull();
  });

  test('returns unverifiable for very incomplete address', () => {
    const result: AddressValidationResult = validateAddress('xyz');

    expect(result.status).toBe('unverifiable');
    expect(result.confidence).toBeLessThan(0.5);
  });

  test('handles addresses with punctuation', () => {
    const result: AddressValidationResult = validateAddress('123 Main St., Anytown, CA. 12345');

    expect(result.validated?.streetName).toBe('Main Street');
    expect(result.validated?.city).toBe('Anytown');
    expect(result.validated?.state).toBe('CA');
  });

  test('handles mixed case input', () => {
    const result: AddressValidationResult = validateAddress('123 mAiN sT, anyTOWN, ca 12345');

    expect(result.validated?.streetName).toBe('Main Street');
    expect(result.validated?.city).toBe('Anytown');
    expect(result.validated?.state).toBe('CA');
  });

  test('handles apartment numbers', () => {
    const result: AddressValidationResult = validateAddress('123A Oak Street, Springfield, IL 62701');

    expect(result.validated?.streetNumber).toBe('123A');
    expect(result.validated?.streetName).toBe('Oak Street');
  });

  test('confidence calculation', () => {
    const complete: AddressValidationResult = validateAddress('123 Main St, Anytown, CA 12345');
    const partial: AddressValidationResult = validateAddress('Main St, Anytown');
    const minimal: AddressValidationResult = validateAddress('123');

    expect(complete.confidence).toBeGreaterThan(partial.confidence);
    expect(partial.confidence).toBeGreaterThan(minimal.confidence);
  });
});