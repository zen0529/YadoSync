import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePropertyForm } from './validatePropertyForm';
import { toast } from 'sonner';
import { isValidPhoneNumber } from 'libphonenumber-js';

// Mock the dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('libphonenumber-js', () => ({
  isValidPhoneNumber: vi.fn(),
}));

describe('validatePropertyForm', () => {
  const mockSetTab = vi.fn();

  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Default mock behavior for phone number validation
    isValidPhoneNumber.mockReturnValue(true);
  });

  it('should return true for a valid form', () => {
    const validForm = {
      title: 'Beautiful Villa',
      currency: 'USD',
      phone: '+1234567890',
      country: 'US',
    };

    const result = validatePropertyForm(validForm, mockSetTab);

    expect(result).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
    expect(mockSetTab).not.toHaveBeenCalled();
  });

  it('should return false and show error if title is empty', () => {
    const invalidForm = {
      title: '   ',
      currency: 'USD',
    };

    const result = validatePropertyForm(invalidForm, mockSetTab);

    expect(result).toBe(false);
    expect(mockSetTab).toHaveBeenCalledWith('basic');
    expect(toast.error).toHaveBeenCalledWith('Property title is required.', expect.any(Object));
  });

  it('should return false and show error if currency is missing', () => {
    const invalidForm = {
      title: 'Villa',
      currency: '',
    };

    const result = validatePropertyForm(invalidForm, mockSetTab);

    expect(result).toBe(false);
    expect(mockSetTab).toHaveBeenCalledWith('basic');
    expect(toast.error).toHaveBeenCalledWith('Currency is required.', expect.any(Object));
  });

  it('should return false and show error if phone number is invalid for the country', () => {
    const invalidForm = {
      title: 'Villa',
      currency: 'USD',
      phone: '123',
      country: 'US',
    };

    // Simulate invalid phone number
    isValidPhoneNumber.mockReturnValue(false);

    const result = validatePropertyForm(invalidForm, mockSetTab);

    expect(result).toBe(false);
    expect(mockSetTab).toHaveBeenCalledWith('basic');
    expect(toast.error).toHaveBeenCalledWith('Phone number is invalid for the selected country.', expect.any(Object));
  });

  it('should allow empty phone number', () => {
    const validFormWithoutPhone = {
      title: 'Villa',
      currency: 'USD',
      phone: '',
      country: 'US',
    };

    const result = validatePropertyForm(validFormWithoutPhone, mockSetTab);

    expect(result).toBe(true);
    expect(isValidPhoneNumber).not.toHaveBeenCalled();
  });
});
