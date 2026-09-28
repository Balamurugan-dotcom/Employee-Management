/**
 * Password Complexity Validator
 * Enforces enterprise-grade password security rules:
 * 1. Minimum 8 characters in length
 * 2. At least one uppercase letter (A-Z)
 * 3. At least one lowercase letter (a-z)
 * 4. At least one numeric digit (0-9)
 * 5. At least one special symbol (!@#$%^&* etc.)
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required and must be a string.',
      errors: ['Password is required.'],
    };
  }

  const errors = [];

  if (password.length < 8) {
    errors.push('at least 8 characters in length');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('at least one uppercase letter (A-Z)');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('at least one lowercase letter (a-z)');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('at least one number (0-9)');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('at least one special symbol (e.g. !@#$%^&*)');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      message: `Password does not meet complexity requirements. It must have ${errors.join(', ')}.`,
      errors,
    };
  }

  return {
    isValid: true,
    message: 'Password meets all complexity requirements.',
    errors: [],
  };
};

module.exports = { validatePassword };
