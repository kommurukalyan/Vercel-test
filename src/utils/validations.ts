import { isEmailValid } from '@sideway/address';

import { parseCreditCard, parsePhoneNumber } from '@/utils/helpers';

const maxLength = (max: number) => (value: string) =>
  value && value.length > max ? `Must be ${max} characters or less` : undefined;

const minLength = (min: number) => (value: any) =>
  value && value.length < min ? `Must be ${min} characters or more` : undefined;

/**
 * US zip code validations
 *
 * @param {string} value Input zipcode. Acceptable values -> 12345, 12345-6789, 12345 1234
 * @returns {any} Error msg or undefined
 */
const zipCodeValidation = (value: string) =>
  value &&
  (!/^\d{5}(?:[-\s]\d{4})?$/.test(value)
    ? 'Must be a valid zip code'
    : undefined);

const validations = {
  email: (value: string) =>
    value && !isEmailValid(value) ? 'Invalid email address' : undefined,

  minPasswordLength: minLength(8),
  maxCharLength: maxLength(250),

  minValue: (min: number) => (value: number) =>
    value && value < min ? `Must be at least ${min}` : undefined,
  minLength: (min: number) => (value: string | number) =>
    value && `${value}`.length < min
      ? `Must be at least ${min} characters`
      : undefined,

  number: (value: any) =>
    value && Number.isNaN(Number(value)) ? 'Must be a number' : undefined,

  phoneNumber: (value: any) => {
    const parsedNumber = parsePhoneNumber(value);
    return parsedNumber && parsedNumber.length < 10
      ? 'Invalid phone number, must be 10 digits'
      : undefined;
  },
  creditCard: (value: any) => {
    const parsedNumber = parseCreditCard(value);
    return parsedNumber && parsedNumber.length < 16
      ? 'Invalid credit card number, must be 16 digits'
      : undefined;
  },
  cvv: (value: any) => {
    const parsedNumber = parseCreditCard(value);
    return parsedNumber && parsedNumber.length < 3
      ? 'Invalid cvv, must be 3 digits'
      : undefined;
  },

  required: (value: any) =>
    value && `${value}`.trim() ? undefined : 'This field is required',

  mortgage: (value: any) =>
    value && `${value}`.trim() ? undefined : 'Required',

  matchPassword: (password: any) => (value: any) =>
    value && value !== password ? 'Password do not match' : undefined,
  zipCode: (value: any) => zipCodeValidation(value),

  showEmailError: (showError: boolean) =>
    showError ? 'Email already exists' : undefined,

  showDuplicatePhoneError: (showError: boolean) =>
    showError ? 'Phone number already exists' : undefined,

  minAmount: (value: any) =>
    value.length < 6 ? 'Minimum amount value is $10,000' : undefined,
};

export default validations;

export const composeValidators =
  (...validators: any) =>
  (value: any) =>
    validators.reduce(
      (error: any, validator: any) => error || validator(value),
      undefined,
    );
