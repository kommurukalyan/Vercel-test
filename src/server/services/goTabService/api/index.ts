import fetchApi from '@/client-service/api';
import config from '@/server/serverUtils/config';
import { toLower } from 'lodash';

//a custom fetch method to get gotab's data
const fetchGotabApi = async (
  payload?: Record<string, any>,
  method: string = 'post',
) => {
  const apiAccessKeys = {
    api_access_id: config.apiAccessKey,
    api_access_secret: config.apiAccessSecret,
  };
  const result = await fetchApi(
    'https://gotab.io/api/oauth/token',
    apiAccessKeys,
    'post',
  );
  const response = await result.json();
  const headerObject: any = {
    Authorization: `Bearer ${response.token}`,
  };
  const endpoint = 'https://gotab.io/api/graph';
  let request = {
    body: JSON.stringify(payload),
    headers: headerObject,
    method: toLower(method),
  };

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

export default fetchGotabApi;
