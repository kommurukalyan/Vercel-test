import { getErrorResponse } from '@/server/serverUtils/helpers';
import logger from '@/server/serverUtils/logger';
import { toLower } from 'lodash';

const fetchWebflowApi = (
  endpoint: string,
  payload?: Record<string, any>,
  method: string = 'get',
  headers: Record<string, any> = {},
) => {
  const headerObject: any = {
    'Content-type': 'application/json; charset=UTF-8',
    ...headers,
  };

  let request = {};
  if (toLower(method) === 'post' || toLower(method) === 'put') {
    request = {
      body: JSON.stringify(payload),
      headers: headerObject,
      method: toLower(method),
    };
  } else {
    request = {
      headers: headerObject,
      method: toLower(method),
    };
  }

  try {
    return fetch(endpoint, request);
  } catch (error) {
    logger.log(error, undefined, 'error');
  }
};

export default fetchWebflowApi;
