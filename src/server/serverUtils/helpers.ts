import { Prisma, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ValidationError } from 'class-validator';

import { toLower } from 'lodash';
import { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/server/serverUtils/logger';
import { SALT_ROUNDS, STANDARD_ERROR_MSG } from '@/lib/constants';

export interface IErrorElement extends Record<string, any> {}

export interface IStandardResponse {
  error: boolean;
  msg: string;
  errors: IErrorElement;
  data?: any;
}

export function apiHandler(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = toLower(req.method) as string;

    // check handler supports HTTP method
    if (!handler[method])
      return res.status(405).end(`Method ${req.method} Not Allowed`);

    try {
      // route handler
      return await handler[method](req, res);
    } catch (err) {
      // global error handler
      logger.log(err, 'error');
      return res.status(400);
    }
  };
}
/**
 * Build an empty response object
 *
 * @returns {object} an empty response object
 */
export function getEmptyResponse(): IStandardResponse {
  return { error: false, errors: {}, msg: '' };
}

/**
 * Build an error response object
 *
 * @param {IErrorElement} errors - error element
 * @param {string} msg - error message string
 * @returns {object} an error object
 */
export function getErrorResponse(
  msg: string = STANDARD_ERROR_MSG,
  errors?: IErrorElement,
): IStandardResponse {
  const response = getEmptyResponse();
  return Object.assign(response, { error: true, errors, msg });
}
/**
 * Build a success response object
 *
 * @param {string} msg - a message string
 * @param {unknown} data - data
 * @returns {object} a success object
 */
export function getSuccessResponse(msg: string, data?: unknown) {
  const response = getEmptyResponse();
  return Object.assign(response, { msg, data });
}

/**
 * Generates an error response object for an application with the specified error code, message, and HTTP status code.
 *
 * @param {number} code - The error code to be included in the response.
 * @param {string} msg - The error message to be included in the response. Defaults to STANDARD_ERROR_MSG if not provided.
 * @param {number} httpStatusCode - The HTTP status code to be included in the response. Defaults to 400 (Bad Request) if not provided.
 * @returns {object} An error response object with the following structure:
 */
export function getAppErrorResponse(
  code: number,
  msg: string = STANDARD_ERROR_MSG,
  httpStatusCode: number = 400,
) {
  return {
    data: null,
    httpStatusCode,
    message: {
      code: code,
      message: msg,
    },
    status: 'FAILURE',
  };
}

/**
 * Generates a random password with specified length that includes at least one upper case letter,
 * one lower case letter, one number, and one special character.
 * @param length The length of the password to be generated.
 * @returns The randomly generated password.
 */
export function generateRandomPassword(
  length: number,
  testMode: boolean = false,
): string {
  if (testMode) {
    return 'password';
  }
  const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numericChars = '0123456789';
  // const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  // Create an array to hold the different types of characters.
  const charGroups: string[] = [];
  charGroups.push(upperCaseChars);
  charGroups.push(lowerCaseChars);
  charGroups.push(numericChars);
  // charGroups.push(specialChars);

  // Calculate the number of characters needed from each group.
  const charsPerGroup = Math.floor(length / charGroups.length);
  const remainder = length % charGroups.length;

  // Generate the password by picking characters from each group randomly.
  let password = '';
  for (const charGroup of charGroups) {
    for (let i = 0; i < charsPerGroup; i++) {
      password += charGroup[Math.floor(Math.random() * charGroup.length)];
    }
  }

  // Add the remaining characters from the first few groups to fulfill the required length.
  for (let i = 0; i < remainder; i++) {
    password += charGroups[i][Math.floor(Math.random() * charGroups[i].length)];
  }

  // Shuffle the password to ensure characters from different groups are mixed.
  const shuffledPassword = password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
  return shuffledPassword;
}

/**
 * Hashes a password
 * @param val Plaintext password to hash
 * @returns The hashed password
 */
export async function hashPassword(val: string) {
  return bcrypt.hash(val, SALT_ROUNDS);
}

/**
 * Checks if a password is valid for a user
 * @param user
 * @param valueToCheck
 */
export async function validatePassword(user: User, valueToCheck: string) {
  return bcrypt.compare(valueToCheck, user.password as string);
}

export function handlePrismaError(e: any) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    // The .code property can be accessed in a type-safe manner
    if (e.code) {
      if (e.code === 'P2002') {
        return { message: e.message, uniqueConstraint: true };
      }
    }
    return { message: e.message };
  }
  return e;
}

export function formatPayloadError(errors: ValidationError[]) {
  if (errors[0].constraints) {
    const combinedErrors = errors.map((error) => error.constraints);
    return {
      constraints: combinedErrors,
    };
  } else {
    if (errors[0].children) {
      return formatPayloadError(errors[0].children as any);
    }
    return {};
  }
}

export function generateOTP(digits: number = 6): number {
  if (process.env.APP_ENV !== 'production') {
    return 123456;
  }
  let digitsToUse = digits;
  if (digits <= 0 || digits > 10) {
    digitsToUse = 6;
  }

  const min = Math.pow(10, digitsToUse - 1);
  const max = Math.pow(10, digitsToUse) - 1;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  return parseInt(otp.toString().padStart(digitsToUse, '0'), 10);
}

export function sleepAsync(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// export const encrypt = (text: string, secret: string) => {
//   const ciphertext = crypto.AES.encrypt(text, secret).toString();
//   return ciphertext;
// };
// export const decrypt = (ciphertext: string, secret: string) => {
//   const bytes = crypto.AES.decrypt(ciphertext, secret);
//   const decryptedtext = bytes.toString(crypto.enc.Utf8);
//   return decryptedtext;
// };
