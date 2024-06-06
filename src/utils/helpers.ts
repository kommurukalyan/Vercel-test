import { isEmpty, pick } from 'lodash';
/**
 * Helper function to return null if no character is present
 *
 * @param {any} value - typed value
 * @returns {string | null} - return null if input is empty else returns same value
 */
export function normalizeText(value: any): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return value;
}

/**
 * Remove all non-digits from a string
 *
 * @param {string} value - a string that has extra non-number characters
 * @returns {string} - a number-looking string
 */
export function parseNumber(value: string): string {
  if (!value) {
    return value;
  }
  return value.replace(/[^0-9]/g, '');
}

/**
 * Helper function to filter any non-digit and return 10 digit phone number
 *
 * @param {string} value - number string
 * @returns {number} - a 10-digit phone number, ex. 1234567890
 */
export function parsePhoneNumber(value: any) {
  if (!value || typeof value !== 'string') {
    return value;
  }
  return value.replace(/[^0-9]/g, '').substring(0, 10);
}

/**
 * Helper function to filter any non-digit and return 16 digit credit card
 *
 * @param {string} value - number string
 * @returns {number} - a 16-digit credit card number, ex. 1234567890123456
 */
export function parseCreditCard(value: any) {
  if (!value || typeof value !== 'string') {
    return value;
  }

  const onlyNums = value.replace(/[^0-9]/g, '');

  return onlyNums.substring(0, 16);
}

/**
 * Helper function to filter any non-digit and return 3 digit cvv
 *
 * @param {string} value - number string
 * @returns {number} - a 8-digit cvv number, ex. 123
 */
export function parseCvv(value: any) {
  if (!value || typeof value !== 'string') {
    return value;
  }

  const onlyNums = value.replace(/[^0-9]/g, '');

  return onlyNums.substring(0, 3);
}

/**
 * Format a number to look like a phone number
 *
 * @param {string | undefined} value - a string that we want to be formatted like a phone number
 * @param {string} previousValue - previously typed string, to confirm<br>
 * that the user is typing forward, not deleting
 * @returns {string} - the phone number-looking string
 */
export function normalizePhone(
  value: string | undefined,
  previousValue?: string,
) {
  if (!value) {
    return value;
  }
  let valueToUse = value;
  if (typeof valueToUse !== 'string') {
    valueToUse = `${valueToUse}`;
  }
  const onlyNums = valueToUse.replace(/[^\d]/g, '');
  if (!previousValue || valueToUse.length > previousValue.length) {
    // typing forward
    if (onlyNums.length === 3) {
      return `${onlyNums}`;
    }
    if (onlyNums.length === 6) {
      return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
    }
  }
  if (onlyNums.length <= 3) {
    return onlyNums;
  }
  if (onlyNums.length <= 6) {
    return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
  }
  return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 6)}-${onlyNums.slice(
    6,
    10,
  )}`;
}

/**
 * Format a number to look like a credit card number
 *
 * @param {string | undefined} value - a string that we want to be formatted like a credit card number
 * @param {string} previousValue - previously typed string, to confirm<br>
 * that the user is typing forward, not deleting
 * @returns {string} - the credit card number-looking string
 */

export function normalizeCreditCard(
  value: string | undefined,
  previousValue?: string,
) {
  if (!value) {
    return value;
  }

  let valueToUse = value;
  if (typeof valueToUse !== 'string') {
    valueToUse = `${valueToUse}`;
  }

  const onlyNums = valueToUse.replace(/[^\d]/g, '');

  if (!previousValue || valueToUse.length > previousValue.length) {
    // typing forward
    if (onlyNums.length <= 4) {
      return `${onlyNums}`;
    }
    if (onlyNums.length <= 8) {
      return `${onlyNums.slice(0, 4)}-${onlyNums.slice(4)}`;
    }
    if (onlyNums.length <= 12) {
      return `${onlyNums.slice(0, 4)}-${onlyNums.slice(4, 8)}-${onlyNums.slice(
        8,
      )}`;
    }
    return `${onlyNums.slice(0, 4)}-${onlyNums.slice(4, 8)}-${onlyNums.slice(
      8,
      12,
    )}-${onlyNums.slice(12, 16)}`;
  }

  return onlyNums;
}

export function formatFileNameForS3(fileName: string) {
  return fileName.replace(/ /g, '_');
}

export function frameSpaceInitialValues(row: any) {
  if (isEmpty(row)) {
    return {};
  }
  const values = pick(row, [
    'title',
    'info',
    'isMandatory',
    'questionnaireFlag',
    'hasMaster',
    'icon',
  ]);
  return values;
}
export function frameQuestionInitialValues(row: any) {
  if (isEmpty(row)) {
    return {};
  }
  const values = pick(row, ['question']);
  return values;
}
export function frameEditUserInitialValues(row: any) {
  if (isEmpty(row)) {
    return {};
  }
  const values = pick(row, ['name', 'email', 'phoneNumber', 'role']);
  return values;
}

export function frameAppSettingsInitialValues(row: any) {
  if (isEmpty(row)) {
    return {};
  }
  const values = pick(row, [
    'supportPhone',
    'supportEmail',
    'notificationEmail',
    'minDurationInMin',
    'maxDurationInMin',
    'primaryColor',
    'secondaryColor',
    'companyDisplayName',
  ]);
  return values;
}

export function isSpaceCheckboxesValid(
  param1: boolean,
  param2: boolean,
  param3: boolean,
) {
  if (param1 || param2 || param3) {
    return false;
  } else {
    return true;
  }
}

export function frameAppProfileInitialValues(user: any) {
  if (isEmpty(user)) {
    return {};
  }
  const values = pick(user, ['contactName', 'email', 'phoneNumber']);
  const valuesToSend = {
    ...values,
    name: values.contactName,
  };

  return valuesToSend;
}
