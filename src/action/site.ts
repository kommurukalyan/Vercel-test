import fetchApi from '@/client-service/api';
import AddSiteRequest from '@/server/request/addSiteRequest';
import { emitErrorNotification, emitNotification } from '@/lib/helper';

// eslint-disable-next-line import/prefer-default-export
export async function getSites(token: string) {
  try {
    const result = await fetchApi('/api/sites', {}, 'get', {
      Authorization: `Bearer ${token}`,
    });
    const response = await result.json();
    if (!response.error) {
      return response;
    } else {
      //console.log('error:', response.msg);
      emitErrorNotification(response.msg);
      return [];
    }
  } catch (error) {
    //console.log('catch error:', error);
    return [];
  }
}
export async function createSite(payload: AddSiteRequest, token: string) {
  try {
    const result = await fetchApi('/api/sites', payload, 'post', {
      Authorization: `Bearer ${token}`,
    });
    const response = await result.json();
   return response;
  } catch (error) {
    emitErrorNotification(error as string);
    return false;
  }
}
export async function deleteSite(siteId: string, token: string) {
  try {
    const result = await fetchApi(`/api/sites/${siteId}`, {}, 'DELETE', {
      Authorization: `Bearer ${token}`,
    });
    const response = await result.json();
    if (!response.error) {
      emitNotification('success', response.msg);
      return true;
    } else {
      emitErrorNotification(response.msg);
      return false;
    }
  } catch (error) {
    emitErrorNotification(error as string);
    return false;
  }
}
export async function repollData(siteId: string, token: string) {
  try {
    const result = await fetchApi(`/api/sites/repoll/${siteId}`, {}, 'post', {
      Authorization: `Bearer ${token}`,
    });
    const response = await result.json();
   return response;
  } catch (error) {
    emitErrorNotification(error as string);
    return false;
  }
}
