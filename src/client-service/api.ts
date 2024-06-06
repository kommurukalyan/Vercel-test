import { getUserToken } from '@/utils/verifyAuthentication';
import { toLower } from 'lodash';

const fetchApi = (
  endpoint: string,
  payload?: Record<string, any>,
  method: string = 'get',
  headers: Record<string, any> = {},
) => {
  const headerObject: any = {
    'Content-type': 'application/json; charset=UTF-8',
    'client-id': 'jbsdihads0138hakdni',
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
  } catch (e) {
    const stringError = e?.toString?.();
    const type =
      stringError === 'TypeError: Network request failed'
        ? 'networkError'
        : 'unknown';
    const error = {
      text: stringError,
      type,
    };
    throw error;
  }
};

export default fetchApi;
