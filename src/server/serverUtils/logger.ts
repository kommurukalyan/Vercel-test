/* eslint-disable no-console */
import moment from 'moment';

/**
 * Utility for logging
 *
 * @class Logger
 */
class Logger {
  /**
   * Log a message<br>
   * Note: in non-production environments, this will only ever log to the console
   *
   * @param {any} message - The message contents
   * @param {string} [level='log'] - The log level. Defaults to just printing to the console.<br>
   * If 'error' then the message will be reported to Sentry
   * @param {string} [annotation=''] - Additional context for the error
   * @param {boolean} [forceLog=false] - It true, will log to the<br>
   * console no matter what the log level is
   * @memberof Logger
   */
  log(
    message: any,
    level: 'log' | 'error' = 'error',
    annotation: string = '',
    forceLog: boolean = true,
  ) {
    if (
      level === 'log' ||
      forceLog === true ||
      process.env.NODE_ENV !== 'production'
    ) {
      console.error(message, annotation);
    }
    if (level === 'error' && process.env.NODE_ENV === 'production') {
      try {
        if (typeof message === 'string') {
          // Bots are setting invalid Origin headers so don't push those to Sentry
          if (
            message.indexOf('Origin:') === -1 &&
            message.indexOf('not allowed') === -1
          ) {
            // Sentry.captureMessage(message);
            console.error(message);
          }
        } else {
          console.log('captureException');
          console.error(message);
          // Sentry.captureException(message);
        }
      } catch (e) {
        console.log('Error sending to Sentry:');
        console.log('Message: ');
        console.log(message);
        console.log('Annotation: ');
        console.log(annotation);
        console.log(e);
      }
    }
  }

  timer(
    name: string,
    type: 'Database' | 'Endpoint' | 'Other' = 'Database',
    sampleRate: number = 1.0,
  ) {
    if (Math.random() >= sampleRate) {
      // eslint-disable-next-line no-unused-vars
      return { end: (_: string = '') => {} };
    }
    const startTime = moment();
    return {
      end: (annotation: string = '') =>
        this.log(
          `Timings.${type}.${name.replace('.', '#')}\t${moment().diff(
            startTime,
          )}`,
          'log',
          annotation,
        ),
    };
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new Logger();
