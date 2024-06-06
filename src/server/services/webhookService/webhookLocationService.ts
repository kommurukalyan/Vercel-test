import prisma from '@/lib/prisma';
import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import logger from '@/server/serverUtils/logger';
import { getLocation } from '../goTabService/graphApiQueries/location';
import AddressService from '../addressService';
import LocationService from '../locationService';
import ErrorLog from '../errorLog';

export default class WebhookLocationService {
  //method that triggers when location-updated webhook triggers
  public static updateWebhookLocation = async (payload: any) => {
    try {
      //getting location details from middleware
      const middlewareLocation = await prisma.location.findUnique({
        include: {
          Site: true,
        },
        where: {
          locationUuid: payload.target_uuid,
        },
      });

      const middlewareAddress = await prisma.address.findUnique({
        include: {
          Site: true,
        },
        where: {
          addressUuid: payload.target_uuid,
        },
      });
      //checking if the location is present in middleware and if found,we are updating
      if (middlewareLocation) {
        //fetching location details from gotab
        const goTabLocationResult = await getLocation(payload.target_id);
        if (goTabLocationResult) {
          const updatedWebflowAddress = await AddressService.update(
            middlewareAddress?.Site?.apiKey,
            middlewareAddress?.Site?.webflowAddressCollectionId as string,
            goTabLocationResult.data.address,
            middlewareAddress?.webflowAddressId as string,
          );
          if (!updatedWebflowAddress.error) {
            //updating a location if it is  present in our middleware
            const updatedWebflowLocation = await LocationService.update(
              middlewareLocation?.Site?.apiKey,
              middlewareLocation?.Site?.webflowLocationCollectionId as string,
              goTabLocationResult.data,
              middlewareAddress?.webflowAddressId as string,
              middlewareLocation,
            );
            if (!updatedWebflowLocation.error) {
              return getSuccessResponse(
                'successfully updated a location',
                updatedWebflowLocation,
              );
            } else {
              const errorMsg = `Error updating a location during LOCATION_UPDATED webhook, ${updatedWebflowLocation.errors.response.data.message}`;
              await ErrorLog.logErrorToDb(
                updatedWebflowLocation.errors.response.data.code,
                errorMsg,
                middlewareLocation?.Site?.id,
                payload,
                updatedWebflowLocation?.errors?.response.config,
              );
              return getErrorResponse(errorMsg, updatedWebflowLocation);
            }
          } else {
            const errorMsg = `Error updating a address during LOCATION_UPDATED webhook, ${updatedWebflowAddress.errors.response.data.message}`;
            await ErrorLog.logErrorToDb(
              updatedWebflowAddress.errors.response.data.code,
              errorMsg,
              middlewareLocation?.Site?.id,
              payload,
              updatedWebflowAddress?.errors?.response.config,
            );
            return getErrorResponse(errorMsg, updatedWebflowAddress);
          }
        }
      } else {
        //if the location is not found in middleware we are returning the below response
        return getErrorResponse('No Such Location exists/Invalid LocationUuid');
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse();
    }
  };
}
