import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import CollectionService from './collectionService';
import prisma from '@/lib/prisma';
import logger from '../serverUtils/logger';
import CategoryService from './categoryService';
import config from '../serverUtils/config';
import EncryptionClient from '../serverUtils/EncryptionClient';

export default class MenuService {
  public static create = async (
    apiKey: string,
    menuCollectionId: any,
    payload: any,
    siteId: number,
  ) => {
    try {
      const categoryNames = payload.menuCategoriesList.map(
        (ele: any) => ele.label,
      );
      const categories = await CategoryService.getByCategoryName(
        categoryNames,
        siteId,
      );
      const fieldData = {
        enabled: payload.enabled,
        name: payload.name,
        available: payload.available,
        'menu-uuid': payload.menuUuid,
        menuid: Number(payload.menuId),
        menuheader: payload.menuHeader,
        menufooter: payload.menuFooter,
        categories: categories,
      };
      const createdMenu = await CollectionService.create(
        menuCollectionId,
        apiKey,
        fieldData,
      );
      if (!createdMenu.error) {
        await prisma.menu.create({
          data: {
            webflowMenuId: createdMenu.data.id,
            gotabMenuId: payload.menuId,
            siteId: siteId,
          },
        });
        await categoryNames.map(async (ele: any) => {
          const middlewareCategory = await prisma.menuCategory.findMany({
            where: {
              gotabCategoryName: ele,
              gotabMenuId: payload.menuId,
              siteId: siteId,
            },
          });
          if (middlewareCategory.length == 0) {
            await prisma.menuCategory.create({
              data: {
                gotabCategoryName: ele,
                gotabMenuId: payload.menuId,
                siteId: siteId,
              },
            });
          }
        });
        return getSuccessResponse('success', createdMenu);
      } else {
        return createdMenu;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error adding MenuUuid' + payload.menuUuid + ' for siteId' + siteId,
      );
    }
  };

  public static update = async (
    apiKey: string,
    menuCollectionId: any,
    payload: any,
    middlewareMenu: any,
  ) => {
    try {
      const categoryNames = payload.menuCategoriesList.map(
        (ele: any) => ele.label,
      );
      const categories = await CategoryService.getByCategoryName(
        categoryNames,
        middlewareMenu?.Site?.id,
      );
      const fieldData = {
        enabled: payload.enabled,
        name: payload.name,
        available: payload.available,
        'menu-uuid': payload.menuUuid,
        menuid: Number(payload.menuId),
        menuheader: payload.menuHeader,
        menufooter: payload.menuFooter,
        categories: categories,
      };
      const updatedMenu = await CollectionService.update(
        menuCollectionId,
        middlewareMenu?.webflowMenuId,
        apiKey,
        fieldData,
      );
      if (!updatedMenu.error) {
        await categoryNames.map(async (ele: any) => {
          const middlewareCategory = await prisma.menuCategory.findMany({
            where: {
              gotabCategoryName: ele,
              gotabMenuId: payload.menuId,
              siteId: middlewareMenu?.Site?.id,
            },
          });
          if (middlewareCategory.length == 0) {
            await prisma.menuCategory.create({
              data: {
                gotabCategoryName: ele,
                gotabMenuId: payload.menuId,
                siteId: middlewareMenu?.Site?.id,
              },
            });
          }
        });
        return getSuccessResponse('success', updatedMenu);
      } else {
        return updatedMenu;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse('Error updating MenuUuid' + payload.menuUuid);
    }
  };

  public static delete = async (
    apiKey: string,
    collectionId: any,
    payload: any,
    siteId: any,
  ) => {
    try {
      //fetching middleware data of a single menu
      const middlewareMenu = await prisma.menu.findUnique({
        where: { gotabMenuId: payload.gotabMenuId, siteId: siteId },
      });
      //if the menu present in middleware we are first deleting it and then removing it
      if (middlewareMenu) {
        const deletedMenu = await CollectionService.delete(
          collectionId,
          middlewareMenu?.webflowMenuId,
          apiKey,
        );
        if (!deletedMenu.error) {
          const removedMenu = await CollectionService.remove(
            collectionId,
            middlewareMenu?.webflowMenuId,
            apiKey,
          );
          if (!removedMenu.error) {
            //after removing deleting it from menu table
            await prisma.menu.delete({
              where: { gotabMenuId: payload?.gotabMenuId, siteId: siteId },
            });
            //also deleting its associated category mappings from menu-category table
            await prisma.menuCategory.deleteMany({
              where: { gotabMenuId: payload?.gotabMenuId, siteId: siteId },
            });
          } else {
            return removedMenu;
          }
        } else {
          return deletedMenu;
        }
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse('Error deleting MenuUuid' + payload.menuUuid);
    }
  };

  public static sync = async (
    apiKey: string,
    menuCollectionId: any,
    payload: any,
    siteId: number,
  ) => {
    try {
      const middlewareMenu = await prisma.menu.findUnique({
        where: { gotabMenuId: payload.menuId },
        include: { Site: true },
      });
      if (!middlewareMenu && payload.available && payload.enabled) {
        const decryptedApiKey = EncryptionClient.decryptData(apiKey as string);
        return this.create(decryptedApiKey, menuCollectionId, payload, siteId);
      } else {
        if (payload.available && payload.enabled) {
          return this.update(apiKey, menuCollectionId, payload, middlewareMenu);
        } else return this.delete(apiKey, menuCollectionId, payload, siteId);
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error syncing MenuUuid' + payload.menuUuid + ' for siteId' + siteId,
      );
    }
  };
}
