import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import CollectionService from './collectionService';
import prisma from '@/lib/prisma';
import logger from '../serverUtils/logger';

export default class LocationService {
  public static create = async (
    apiKey: any,
    collectionId: string,
    payload: any,
    webflowAddressId: any,
    siteId: number,
  ) => {
    try {
      // Add location to webflow
      let fieldData = {
        name: payload?.name,
        'location-name': payload?.name,
        locationuuid: payload?.locationUuid,
        slug: payload?.urlName,
        available: payload?.available || null,
        address: webflowAddressId,
      };
      const createdLocation = await CollectionService.create(
        collectionId,
        apiKey,
        fieldData,
      );
      if (!createdLocation.error) {
        // Add location to middleware
        await prisma.location.create({
          data: {
            siteId: siteId,
            locationUuid: payload.locationUuid,
            locationName: payload.name,
            webflowLocationId: createdLocation.data.id,
            gotabLocationId: payload.locationId,
          },
        });
        return getSuccessResponse('success', createdLocation);
      } else {
        return createdLocation;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error adding locationUuid' +
          payload.locationUuid +
          ' for siteId' +
          siteId,
      );
    }
  };
  public static update = async (
    apiKey: any,
    collectionId: string,
    payload: any,
    webflowAddressId: string,
    middlewareLocation: any,
  ) => {
    try {
      let fieldData = {
        name: payload?.name,
        'location-name': payload?.name,
        locationuuid: payload?.locationUuid,
        available: payload?.available || null,
        address: webflowAddressId,
      };
      const updatedLocation = await CollectionService.update(
        collectionId,
        middlewareLocation?.webflowLocationId,
        apiKey,
        fieldData,
      );
      if (!updatedLocation.error) {
        return getSuccessResponse('success', updatedLocation);
      } else {
        return updatedLocation;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error updating LocationUuid' + payload.locationUuid,
      );
    }
  };

  public static sync = async (
    apiKey: any,
    collectionId: string,
    payload: any,
    webflowAddressId: any,
    siteId: number,
  ) => {
    try {
      const middlewareLocation = await prisma.location.findUnique({
        where: { locationUuid: payload.locationUuid },
        include: {
          Site: true,
        },
      });
      if (!middlewareLocation) {
        return this.create(
          apiKey,
          collectionId,
          payload,
          webflowAddressId,
          siteId,
        );
      } else {
        return this.update(
          apiKey,
          collectionId,
          payload,
          webflowAddressId,
          middlewareLocation,
        );
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error updating LocationUuid' +
          payload.locationUuid +
          ' for siteId' +
          siteId,
      );
    }
  };
}
