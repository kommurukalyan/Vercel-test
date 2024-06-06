import { AlertColor } from '@mui/material/Alert';

import { STANDARD_ERROR_MSG } from '@/lib/constants';
import EventEmitter from '@/lib/eventEmitter';

/**
 * Helper function to trigger notifcation
 *
 * @param {AlertColor} severity Notification severity
 * @param {string} msg Notification Message
 */
export function emitNotification(severity: AlertColor, msg: string) {
  EventEmitter.emit('showNotification', { severity, msg });
}

/**
 * Helper function to trigger error notifcation
 *
 * @param {string} msg Error Message
 */
export function emitErrorNotification(
  msg = 'Something went wrong. Please try again!',
) {
  emitNotification('error', msg);
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
