// Simple validation utilities to replace zod

export const validateEmail = (email: string): string | undefined => {
  if (!email) return 'Email is required';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email';
  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return undefined;
};

export const validateRequired = (value: string, fieldName: string): string | undefined => {
  if (!value || value.trim() === '') return `${fieldName} is required`;
  return undefined;
};

export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): string | undefined => {
  if (!value) return `${fieldName} is required`;
  if (value.length < minLength) return `${fieldName} must be at least ${minLength} characters`;
  return undefined;
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): string | undefined => {
  if (password !== confirmPassword) return "Passwords don't match";
  return undefined;
};

export const validateNumber = (value: string, fieldName: string): string | undefined => {
  if (!value) return `${fieldName} is required`;
  if (isNaN(Number(value))) return `${fieldName} must be a valid number`;
  return undefined;
};
