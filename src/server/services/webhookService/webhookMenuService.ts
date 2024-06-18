import prisma from '@/lib/prisma';

import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import logger from '@/server/serverUtils/logger';
import { getMenuById } from '../goTabService/graphApiQueries/menu';
import MenuService from '../menuService';
import EncryptionClient from '@/server/serverUtils/EncryptionClient';
import ErrorLog from '../errorLog';

export default class WebhookMenuService {
  //method that triggers when menu-updated webhook is triggered
  public static updateWebhookMenu = async (payload: any) => {
    try {
      const goTabMenuResult = await getMenuById(payload.target_id);
      const locationDetails = await prisma.location.findUnique({
        include: {
          Site: true,
        },
        where: {
          locationUuid: payload.location_uuid,
        },
      });
      if (!goTabMenuResult.error) {
        const middlewareMenu = await prisma.menu.findUnique({
          include: {
            Site: true,
          },
          where: {
            gotabMenuId: payload.target_id,
          },
        });
        //checking if the menu exists in our middleware db
        if (middlewareMenu) {
          //fetching gotab menu data by id
          const goTabMenuResult = await getMenuById(payload.target_id);
          //checking if the gotab's menu's archived flag is null i.e., it is not deleted and enabled flag is true
          if (
            goTabMenuResult.data.menu.archived === null &&
            goTabMenuResult.data.menu.enabled === true
          ) {
            if (goTabMenuResult) {
              //updating the webflow category
              const updatedWebflowMenu = await MenuService.update(
                middlewareMenu?.Site?.apiKey as string,
                middlewareMenu?.Site?.webflowMenuCollectionId,
                goTabMenuResult.data.menu,
                middlewareMenu,
                middlewareMenu?.Site?.locationUuid,
              );
              if (!updatedWebflowMenu.error) {
                return getSuccessResponse('Menu Updated Successfully');
              } else {
                const errorMsg = `Error updating a Menu during MENU_UPDATED webhook, ${updatedWebflowMenu.errors.response.data.message}`;
                await ErrorLog.logErrorToDb(
                  updatedWebflowMenu.errors.response.data.code,
                  errorMsg,
                  middlewareMenu?.Site?.id,
                  middlewareMenu,
                  updatedWebflowMenu?.errors?.response.config,
                );
                return getErrorResponse(errorMsg, updatedWebflowMenu);
              }
            }
          } else {
            //if the archived flag of gotab menu is not null i.e., it is deleted in gotab
            //if the archived flag of gotab category is not null i.e., it is deleted in gotab
            const deletedMenu = await MenuService.delete(
              middlewareMenu?.Site?.apiKey as string,
              middlewareMenu?.Site?.webflowMenuCollectionId as string,
              middlewareMenu,
              middlewareMenu?.Site?.id,
            );
            if (!deletedMenu?.error) {
              return getSuccessResponse(
                'Menu is completely Removed Successfully as it is not available',
              );
            } else {
              const errorMsg = `Error deleting a Menu during MENU_UPDATED webhook, ${deletedMenu.errors.response.data.message}`;
              await ErrorLog.logErrorToDb(
                deletedMenu.errors.response.data.code,
                errorMsg,
                middlewareMenu?.Site?.id,
                middlewareMenu,
                deletedMenu?.errors?.response.config,
              );
              return getErrorResponse(errorMsg, deletedMenu);
            }
          }
        } else {
          //if the menu is not found in middleware,a new menu is created
          //fetching gotab's menu data by id
          const goTabMenuResult = await getMenuById(payload.target_id);
          const locationDetails = await prisma.location.findUnique({
            include: {
              Site: true,
            },
            where: {
              locationUuid: payload.location_uuid,
            },
          });
          //checking if the menu is enabled and adding to webflow only if they are enabled
          if (goTabMenuResult && goTabMenuResult.data.menu.enabled == true) {
            const decryptedApiKey = EncryptionClient.decryptData(
              locationDetails?.Site?.apiKey as string,
            );
            //adding the new menu to webflow cms
            const addNewWebflowMenu = await MenuService.create(
              decryptedApiKey as string,
              locationDetails?.Site?.webflowMenuCollectionId,
              goTabMenuResult.data.menu,
              locationDetails?.Site?.id as number,
              locationDetails?.locationUuid as string,
            );

            if (!addNewWebflowMenu.error) {
              return getSuccessResponse('New Menu added Successfully');
            } else {
              const errorMsg = `Error adding a New Menu during MENU_UPDATED webhook, ${addNewWebflowMenu.errors.response.data.message}`;
              await ErrorLog.logErrorToDb(
                addNewWebflowMenu.errors.response.data.code,
                errorMsg,
                locationDetails?.Site?.id,
                middlewareMenu,
                addNewWebflowMenu?.errors?.response.config,
              );
              return getErrorResponse(errorMsg, addNewWebflowMenu);
            }
          } else {
            return getErrorResponse('Not adding the Menu as it is not enabled');
          }
        }
      } else {
        const errorMsg = `Error fetching gotabMenu result during PRODUCT_UPDATED webhook, ${goTabMenuResult?.errors[0]?.message}`;
        await ErrorLog.logErrorToDb(
          'Schema Mismatch/property not found',
          errorMsg,
          locationDetails?.Site?.id,
          locationDetails,
        );
        return getErrorResponse(errorMsg, goTabMenuResult);
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse();
    }
  };
}
