import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import CollectionService from './collectionService';
import prisma from '@/lib/prisma';
import logger from '../serverUtils/logger';
import ProductService from './productService';
import config from '../serverUtils/config';
import EncryptionClient from '../serverUtils/EncryptionClient';
import { removeHtmlTags } from '../serverUtils/webflowHelpers';

export default class CategoryService {
  public static create = async (
    apiKey: string,
    categoryCollectionId: any,
    payload: any,
    siteId: number,
    locationuuid: any,
  ) => {
    try {
      const productUuids = payload?.productsList?.map(
        (ele: any) => ele.productUuid,
      );
      const products = await ProductService.getByProductUid(
        productUuids,
        siteId,
      );
      const modifiedDisclaimer = await removeHtmlTags(payload.disclaimer);
      const fieldData = {
        enabled: payload.enabled,
        name: payload.name,
        disclaimer: modifiedDisclaimer,
        categoryid: payload.categoryId,
        locationuuid: locationuuid,
        productslist: products,
      };
      const createdCategory = await CollectionService.create(
        categoryCollectionId,
        apiKey,
        fieldData,
      );
      if (!createdCategory.error) {
        await prisma.category.create({
          data: {
            webflowCategoryId: createdCategory.data.id,
            gotabCategoryId: payload.categoryId,
            gotabCategoryName: payload.name,
            siteId: siteId,
          },
        });
        return getSuccessResponse('success', createdCategory);
      } else {
        return createdCategory;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error adding CategoryUuid' +
          payload.categoryId +
          ' for siteId' +
          siteId,
      );
    }
  };

  public static update = async (
    apiKey: string,
    categoryCollectionId: any,
    payload: any,
    middlewareCategory: any,
    locationuuid: any,
  ) => {
    try {
      const productUuids = payload.productsList.map(
        (ele: any) => ele.productUuid,
      );
      const products = await ProductService.getByProductUid(
        productUuids,
        middlewareCategory?.Site?.id,
      );
      const modifiedDisclaimer = await removeHtmlTags(payload.disclaimer);
      const fieldData = {
        enabled: payload.enabled,
        name: payload.name,
        disclaimer: modifiedDisclaimer,
        categoryid: payload.categoryId,
        locationuuid: locationuuid,
        productslist: products,
      };
      const updatedCategory = await CollectionService.update(
        categoryCollectionId,
        middlewareCategory?.webflowCategoryId,
        apiKey,
        fieldData,
      );
      if (!updatedCategory.error) {
        return getSuccessResponse('success', updatedCategory);
      } else {
        return updatedCategory;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error updating CategoryUuid' + payload.categoryId,
      );
    }
  };

  //method to add updated categories to menu
  public static addCategoryToWebflowMenu = async (
    ApiKey: string,
    gotabMenuId: any,
    siteId: any,
  ) => {
    //getting all categories of a menu that have isDeleted to false
    const mappedCategoriesToMenuFromMenuCategories =
      await prisma.menuCategory.findMany({
        where: {
          gotabMenuId: gotabMenuId,
          isDeleted: false,
          siteId: siteId,
        },
      });
    const mappedCategories = mappedCategoriesToMenuFromMenuCategories.map(
      (ele: any) => ele.gotabCategoryName,
    );
    const categories = await prisma.category.findMany({
      where: {
        gotabCategoryName: {
          in: mappedCategories,
        },
        siteId: siteId,
      },
    });
    const webflowCategoryIdsOfMenu = categories.map((ele: any) => {
      return ele.webflowCategoryId;
    });
    const middlewareMenu = await prisma.menu.findUnique({
      include: {
        Site: true,
      },
      where: {
        gotabMenuId: gotabMenuId,
      },
    });
    let fieldData = { categories: webflowCategoryIdsOfMenu };
    const updatedMenu = await CollectionService.update(
      middlewareMenu?.Site?.webflowMenuCollectionId as string,
      middlewareMenu?.webflowMenuId,
      ApiKey,
      fieldData,
    );
    if (!updatedMenu.error) {
      return getSuccessResponse('success', updatedMenu);
    } else {
      return updatedMenu;
    }
  };

  public static delete = async (
    apiKey: string,
    collectionId: any,
    payload: any,
    siteId: any,
  ) => {
    try {
      //getting category from middleware
      const middlewareCategory = await prisma.category.findUnique({
        where: { gotabCategoryId: payload.gotabCategoryId, siteId: siteId },
      });
      const updateCategoryinMiddlewareDb = await prisma.menuCategory.findMany({
        where: { gotabCategoryName: payload.gotabCategoryName, siteId: siteId },
      });
      const mappedmenuIdsOfCategory = updateCategoryinMiddlewareDb.map(
        (ele: any) => ele.gotabMenuId,
      );
      const updateMenuCategoryinMiddleware =
        await prisma.menuCategory.updateMany({
          where: {
            gotabCategoryName: payload?.gotabCategoryName,
            siteId: siteId,
          },
          data: { isDeleted: true },
        });
      let promise = new Promise((resolve: any, reject: any) => {
        if (mappedmenuIdsOfCategory.length === 0) {
          resolve();
        }
        mappedmenuIdsOfCategory.forEach(
          async (ele: any, index: any, array: any) => {
            const addedUpdatedCategoriesOfMenu =
              await this.addCategoryToWebflowMenu(
                apiKey as string,
                ele,
                siteId,
              );
            if (!addedUpdatedCategoriesOfMenu.error) {
              if (index === array.length - 1) {
                resolve();
              }
            } else {
              reject(addedUpdatedCategoriesOfMenu);
              return false;
            }
          },
        );
      });
      promise
        .then(async () => {
          const deletedCategory = await CollectionService.delete(
            collectionId,
            middlewareCategory?.webflowCategoryId,
            apiKey,
          );
          if (!deletedCategory.error) {
            const removedCategory = await CollectionService.remove(
              collectionId,
              middlewareCategory?.webflowCategoryId,
              apiKey,
            );
            if (!removedCategory.error) {
              await prisma.category.delete({
                where: {
                  gotabCategoryId: payload?.gotabCategoryId,
                  siteId: siteId,
                },
              });
            } else {
              return removedCategory;
            }
          } else {
            return deletedCategory;
          }
        })
        .catch((error) => {
          return getErrorResponse('error in deleting a category', error);
        });
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error deleting CategoryUuid' + payload.categoryId,
      );
    }
  };

  public static sync = async (
    apiKey: string,
    categoryCollectionId: any,
    payload: any,
    siteId: number,
    locationuuid: any,
  ) => {
    try {
      const middlewareCategory = await prisma.category.findUnique({
        where: { gotabCategoryId: payload.categoryId, siteId: siteId },
        include:{Site:true}
      });
      if (!middlewareCategory && payload.enabled && payload.archived === null) {
        const decryptedApiKey = EncryptionClient.decryptData(apiKey as string);
        return this.create(
          decryptedApiKey,
          categoryCollectionId,
          payload,
          siteId,
          locationuuid,
        );
      } else {
        if (payload.enabled && payload.archived === null) {
          return this.update(
            apiKey,
            categoryCollectionId,
            payload,
            middlewareCategory,
            locationuuid,
          );
        } else
          return this.delete(apiKey, categoryCollectionId, payload, siteId);
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error syncing categoryUuid' +
          payload.categoryId +
          ' for siteId' +
          siteId,
      );
    }
  };

  public static async updateCategoryProducts(
    apiKey: any,
    products: any,
    gotabCategoryId: string,
  ) {
    try {
      const middlewareCategory = await prisma.category.findUnique({
        include: {
          Site: true,
        },
        where: {
          gotabCategoryId: gotabCategoryId,
        },
      });
      let fieldData = { productslist: products };
      const updatedCategory = await CollectionService.update(
        middlewareCategory?.Site?.webflowCategoryCollectionId as string,
        middlewareCategory?.webflowCategoryId,
        apiKey,
        fieldData,
      );
      return getSuccessResponse('success', updatedCategory);
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error updating products for gotabCategoryId' + gotabCategoryId,
      );
    }
  }

  //method to fetch all the categories associated to menu from middleware
  public static async getByCategoryName(categories: any, siteId: any) {
    const categoryList = await prisma.category.findMany({
      where: {
        gotabCategoryName: {
          in: categories,
        },
        siteId: siteId,
      },
    });
    const finalCategoriesList = categoryList.map(
      (ele: any) => ele.webflowCategoryId,
    );
    return finalCategoriesList;
  }
}
