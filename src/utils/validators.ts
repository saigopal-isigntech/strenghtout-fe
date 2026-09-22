/**
 * Universal Form Validation Utilities for StrengthOut Application
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;
export const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validates a single phone number or multiple phone numbers separated by comma, slash, or semicolon.
 * Supports international formats, extensions, and multiple contact numbers.
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone || !phone.trim()) return false;
  const parts = phone.split(/[,/;&|]|\s+or\s+/i).map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return false;
  
  return parts.every(part => {
    const digitsOnly = part.replace(/\D/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  });
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
  if (!phone || !phone.trim()) return null; // Optional if empty
  if (!isValidPhone(phone)) {
    return `Please enter valid ${fieldLabel.toLowerCase()} (7-15 digits per number). Multiple numbers can be separated with commas.`;
  }
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

/**
 * Validates that an avatar URL is a real user-uploaded or user-configured image,
 * and not empty, null, undefined, or a reference to static placeholder/dummy assets.
 */
export const isValidUserAvatar = (url: string | null | undefined): url is string => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return false;
  if (
    trimmed.includes('assets/image.png') ||
    trimmed.includes('assets/logo') ||
    trimmed.endsWith('/image.png') ||
    trimmed === 'image.png'
  ) {
    return false;
  }
  return true;
};
