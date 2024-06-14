import axios from 'axios';
import { getErrorResponse, getSuccessResponse } from './helpers';
import logger from './logger';
import prisma from '@/lib/prisma';
import { delay } from 'lodash';
import AddSiteRequest from '../request/addSiteRequest';

//A custom method to get All the collections of a selected site
export async function getCollectionsBySiteId(siteId: string, apiKey: string) {
  try {
    const AllCollections = await axios({
      method: 'GET',
      url: `https://api.webflow.com/v2/sites/${siteId}/collections`,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
    }).then((result: any) => {
      return result;
    });

    return getSuccessResponse('success', AllCollections.data.collections);
  } catch (error) {
    logger.log(error, undefined, 'error');
    return getErrorResponse();
  }
}

export async function convertToDollars(price: number) {
  const convertedPrice =
    price === 0 || price === null ? '0.00' : (price / 100).toFixed(2);
  const displayPrice = `$${convertedPrice} `;
  return displayPrice;
}

export async function removeHtmlTags(value: string) {
  const spacesRemovedString =
    value === null || value === '' ? null : value.replace(/[\\\n\r]/g, ' ');
  const convertedString =
    spacesRemovedString === null
      ? null
      : spacesRemovedString.replace(/<[^>]*>/g, ' ');
  return convertedString;
}
// export async function markDownToHTML(inputString: string) {
//   let htmlString = inputString.replace(/^#+\s*(.*)$/gm, (match, p1) => {
//     const level = match.indexOf('#') + 1;
//     return `<h${level}>${p1.trim()}</h${level}>`;
//   });
//   if (htmlString.includes('\n\n<br>\n')) {
//     htmlString = htmlString.replace('\n\n<br>\n', '\n\n\n');
//   }
//   const containsExtraLine = htmlString.includes('\n\n');
//   if (containsExtraLine) {
//     htmlString = htmlString.replace('\n\n', '\n');
//   }

//   htmlString = htmlString.replace('\\.', '.').replace('\\|', '|');
//   // Replace Markdown bold (**text**)
//   htmlString = htmlString.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

//   // Replace Markdown italic (*text*)
//   htmlString = htmlString.replace(/\*(.*?)\*/g, '<em>$1</em>');

//   // Replace Markdown strikethrough (~~text~~)
//   htmlString = htmlString.replace(/~~(.*?)~~/g, '<del>$1</del>');

//   // Replace Markdown links ([text](url))
//   htmlString = htmlString.replace(
//     /\[([^\]]+)\]\(([^)]+)\)/g,
//     '<a href="$2">$1</a>',
//   );

//   // Replace Markdown blockquote (> text)
//   htmlString = htmlString.replace(
//     /^>\s*(.*)$/gm,
//     '<blockquote>$1</blockquote>',
//   );

//   // Replace Markdown bullet points
//   htmlString = htmlString.replace(/^\s*[*-]\s*(.*)$/gm, '<li>$1</li>');
//   htmlString = htmlString.replace(/<\/li><li>/g, '</li><li>'); // Fix bullet point spacing
//   //htmlString = `<ul>${htmlString}</ul>`; // Wrap in <ul> tag

//   return htmlString;
// }

export async function markDownToHTML(inputString: string) {
  const outString =
    inputString === null || inputString === ''
      ? null
      : inputString
          .replace(/(?:\>)([^\n]+)(?:[\n$]?)/g, '<blockquote>$1</blockquote>')
          .replace(/(?:\*\*)([^\n]+)(?:\*\*)/g, '<strong>$1</strong>')
          .replace(/(?:\~\~)([^~\n]+)(?:\~\~)/g, '<del>$1</del>')
          .replace(/(?:\*)([^*\n]+)(?:\*)/g, '<em>$1</em>')
          .replace(/(?:######\s)([^\n]+)(?:[\n$]?)/g, '<h6>$1</h6>')
          .replace(/(?:#####\s)([^\n]+)(?:[\n$]?)/g, '<h5>$1</h5>')
          .replace(/(?:####\s)([^\n]+)(?:[\n$]?)/g, '<h4>$1</h4>')
          .replace(/(?:###\s)([^\n]+)(?:[\n$]?)/g, '<h3>$1</h3>')
          .replace(/(?:##\s)([^\n]+)(?:[\n$]?)/g, '<h2>$1</h2>')
          .replace(/(?:#\s)([^\n]+)(?:[\n$]?)/g, '<h1>$1</h1>')
          // ordered list
          .replace(/(?:[0-9]\.\s)([^\n]+)(?:\n)/g, '<ol><li>$1</li></ol>')
          .replace(/(?:<\/li><\/ol><ol><li>)/g, '</li><li>')
          // unordered list
          .replace(/(?:\*\s)([^*\n]+)(?:\n)/g, '<ul><li>$1</li></ul>')
          .replace(/(?:<\/li><\/ul><ul><li>)/g, '</li><li>')
          // to handle * which is not unordered list
          .replace(/(?:\\<ul><li>)([^*]+)(?:<\/li><\/ul>)/g, '* $1')
          .replace(/\\\|/g, '|')
          .replace(/\\\./g, '.')
          .replace(/\*\*\*/g, '<hr>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
          .split('\n')
          .join('</p><p>') + '</p>';

  return outString;
}
// export const handleServiceError = async (errMsg: string, service: any, error: any, siteId: number, payload: AddSiteRequest) => {
//   await ErrorLog.logErrorToDb(
//     error.errors.response.data.code,
//     errMsg,
//     siteId,
//     payload,
//   );
//   console.error(errMsg, error);
// };

export const handleServicePromise = async (
  promise: Promise<any>,
  service: any,
  payload: AddSiteRequest,
  siteId: number,
) => {
  try {
    const result = await promise;
    return result;
  } catch (error) {
    // await handleServiceError(`Error in inserting ${service.name}`, service, error, siteId, payload);
    return { error: true, data: error };
  }
};

export const handleRateLimit = async (promiseArray: any[], limit: number) => {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < promiseArray.length; i += limit) {
    const promises = promiseArray
      .slice(i, i + limit)
      .map((promise) => promise());
    await Promise.all(promises);
    await delay(60000); // Delay for 60 seconds (rate limit)
  }
};
