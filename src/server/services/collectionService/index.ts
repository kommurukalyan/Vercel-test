import axios from 'axios';
import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import config from '@/server/serverUtils/config';
import logger from '@/server/serverUtils/logger';
import EncryptionClient from '@/server/serverUtils/EncryptionClient';

export default class CollectionService {
  //A custom method to create a collection Item in webflow
  public static create = async (
    collectionId: string,
    apiKey: any,
    fieldData: any,
  ) => {
    try {
      const data = { fieldData: fieldData };
      const response = await axios({
        method: 'POST',
        url: `https://api.webflow.com/v2/collections/${collectionId}/items/live`,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        data: data,
      }).then(async (result) => {
        return result.data;
      });
      return getSuccessResponse('success', response);
    } catch (error: any) {
      //logger.log(error, undefined, 'error');
      return getErrorResponse('error while creating', error);
    }
  };

  //A custom method to update a collectionItem
  public static update = async (
    collectionId: string,
    ItemId: any,
    apiKey: any,
    fieldData: any,
  ) => {
    try {
      const decryptedApikey = EncryptionClient.decryptData(apiKey as string);
      const data = { fieldData: fieldData };
      const updatedItem = await axios({
        method: 'PATCH',
        url: `https://api.webflow.com/v2/collections/${collectionId}/items/${ItemId}/live`,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${decryptedApikey}`,
        },
        data: data,
      }).then(async (result) => {
        return result.data;
      });
      return getSuccessResponse('success', updatedItem);
    } catch (error: any) {
      //logger.log(error, undefined, 'error');
      return getErrorResponse('Error while updating', error);
    }
  };

  //A custom method to publish a collection Item
  public static publish = async (
    collectionId: string,
    ItemId: any,
    apiKey: any,
  ) => {
    try {
      const decryptedApikey = EncryptionClient.decryptData(apiKey as string);
      const publishedItem = await axios({
        method: 'POST',
        url: `https://api.webflow.com/v2/collections/${collectionId}/items/publish`,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${decryptedApikey}`,
        },
        data: {
          itemIds: [ItemId],
        },
      }).then((result: any) => {
        return result.data;
      });
      return publishedItem;
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse();
    }
  };

  //A custom method to delete a collection Item which makes cms item into draft stage
  public static delete = async (
    collectionId: any,
    ItemId: any,
    apiKey: any,
  ) => {
    try {
      const decryptedApiKey = EncryptionClient.decryptData(apiKey as string);
      const delete_Item_Webflowurl = `https://api.webflow.com/v2/collections/${collectionId}/items/${ItemId}/live`;
      const deletedCollectionItem = await axios({
        method: 'DELETE',
        url: delete_Item_Webflowurl,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${decryptedApiKey}`,
        },
      }).then(async (result: any) => {
        return result.data;
      });
      return getSuccessResponse('success', deletedCollectionItem);
    } catch (error: any) {
      //logger.log(error, undefined, 'error');
      return getErrorResponse('Error deleting an item', error);
    }
  };

  //A custom method that removes the drafted cms item completely from webflow cms
  public static remove = async (
    collectionId: any,
    ItemId: any,
    apiKey: any,
  ) => {
    try {
      const decryptedApiKey = EncryptionClient.decryptData(apiKey as string);
      const remove_Item_Webflowurl = `https://api.webflow.com/v2/collections/${collectionId}/items/${ItemId}`;
      const removeDraftedCollectionItem = await axios({
        method: 'DELETE',
        url: remove_Item_Webflowurl,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${decryptedApiKey}`,
        },
      }).then(async (result: any) => {
        return result.data;
      });
      return getSuccessResponse('success', removeDraftedCollectionItem);
    } catch (error) {
      // logger.log(error, undefined, 'error');
      return getErrorResponse();
    }
  };
}
