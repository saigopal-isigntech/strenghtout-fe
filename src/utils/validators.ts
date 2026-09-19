/**
 * Universal Form Validation Utilities for StrengthOut Application
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;
export const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

export const isValidPhone = (phone: string): boolean => {
  if (!phone.trim()) return false;
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 8 && digitsOnly.length <= 15 && PHONE_REGEX.test(phone.trim());
};

export const isValidUrl = (url: string): boolean => {
  if (!url || !url.trim()) return false;
  return URL_REGEX.test(url.trim());
};

export const validateEmail = (email: string, fieldLabel = 'Email'): string | null => {
  if (!email || !email.trim()) return `${fieldLabel} is required.`;
  if (!isValidEmail(email)) return `Please enter a valid ${fieldLabel.toLowerCase()} address (e.g. name@domain.com).`;
  return null;
};

export const validatePhone = (phone: string, fieldLabel = 'Phone number'): string | null => {
  if (!phone || !phone.trim()) return `${fieldLabel} is required.`;
  if (!isValidPhone(phone)) return `Please enter a valid 10-15 digit ${fieldLabel.toLowerCase()}.`;
  return null;
};

export const validatePassword = (pwd: string, minLen = 8): string | null => {
  if (!pwd) return 'Password is required.';
  if (pwd.length < minLen) return `Password must be at least ${minLen} characters long.`;
  return null;
};

export const validateRequired = (val: string, fieldLabel: string, minLen = 1): string | null => {
  if (!val || !val.trim()) return `${fieldLabel} is required.`;
  if (val.trim().length < minLen) return `${fieldLabel} must be at least ${minLen} characters long.`;
  return null;
};

export const validateUrl = (url: string, fieldLabel = 'URL'): string | null => {
  if (!url || !url.trim()) return null; // Optional if empty
  if (!isValidUrl(url)) return `Please enter a valid ${fieldLabel.toLowerCase()} (e.g. https://example.com).`;
  return null;
};

export const validateYearRange = (startYear: number, endYear: number): string | null => {
  const currentYear = new Date().getFullYear();
  if (startYear < 1960 || startYear > currentYear + 10) {
    return `Start year must be between 1960 and ${currentYear + 10}.`;
  }
  if (endYear < 1960 || endYear > currentYear + 15) {
    return `End year must be between 1960 and ${currentYear + 15}.`;
  }
  if (endYear < startYear) {
    return 'End year cannot be earlier than start year.';
  }
  return null;
};
