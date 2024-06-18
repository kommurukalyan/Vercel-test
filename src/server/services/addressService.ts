import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import CollectionService from './collectionService';
import prisma from '@/lib/prisma';
import logger from '../serverUtils/logger';
import config from '../serverUtils/config';
import EncryptionClient from '../serverUtils/EncryptionClient';

export default class AddressService {
  public static create = async (
    apiKey: any,
    collectionId: string,
    payload: any,
    siteId: number,
  ) => {
    try {
      // Add address to webflow
      let fieldData = {
        name: payload.city,
        city: payload.city,
        country: payload.country,
        state: payload.state,
        street1: payload.street1,
        addressuuid: payload.addressUuid,
        zip: payload.zip,
      };
      const result = await CollectionService.create(
        collectionId,
        apiKey,
        fieldData,
      );
      if (!result.error) {
        // Add address to middleware
        await prisma.address.create({
          data: {
            addressUuid: payload.addressUuid,
            webflowAddressId: result.data.id,
            siteId: siteId,
          },
        });
        return getSuccessResponse('success', result);
      } else {
        return result;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error adding AddressUuid' +
          payload.addressUuid +
          ' for siteId' +
          siteId,
      );
    }
  };

  public static update = async (
    apiKey: any,
    collectionId: string,
    payload: any,
    itemId: string,
  ) => {
    try {
      let fieldData = {
        name: payload.city,
        country: payload.country,
        state: payload.state,
        street1: payload.street1,
        addressuuid: payload.addressUuid,
        zip: payload.zip,
      };
      const result = await CollectionService.update(
        collectionId,
        itemId,
        apiKey,
        fieldData,
      );
      if (!result.error) {
        return getSuccessResponse('success', result);
      } else {
        return result;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error updating AddressUuid' + payload.addressUuid,
      );
    }
  };

  public static sync = async (
    apiKey: any,
    collectionId: string,
    payload: any,
    siteId: number,
  ) => {
    try {
      const middlewareAddress = await prisma.address.findUnique({
        where: { addressUuid: payload.addressUuid, siteId: siteId },
        include: { Site: true },
      });
      if (!middlewareAddress) {
        const decryptedApiKey = EncryptionClient.decryptData(apiKey as string);
        return this.create(decryptedApiKey, collectionId, payload, siteId);
      } else {
        return this.update(
          apiKey,
          collectionId,
          payload,
          middlewareAddress.webflowAddressId,
        );
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error syncing AddressUuid' +
          payload.addressUuid +
          ' for siteId' +
          siteId,
      );
    }
  };
}
