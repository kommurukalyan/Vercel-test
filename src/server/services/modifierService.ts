import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import CollectionService from './collectionService';
import prisma from '@/lib/prisma';
import logger from '../serverUtils/logger';
import OptionService from './optionService';
import config from '@/server/serverUtils/config';
import EncryptionClient from '../serverUtils/EncryptionClient';
import { convertToDollars } from '../serverUtils/webflowHelpers';
export default class ModifierService {
  public static create = async (
    apiKey: string,
    modifierCollectionId: any,
    payload: any,
    siteId: number,
  ) => {
    try {
      const optionuids =
        payload.options != null
          ? payload.options?.map((ele: any) => ele.uid)
          : null;
      const options =
        payload.options !== null
          ? await OptionService.getByOptionUid(optionuids, siteId)
          : null;
      const displayPrice = await convertToDollars(payload.price);
      const fieldData = {
        variant: payload.variant,
        enabled: payload.enabled,
        key: payload.key,
        price: payload.price,
        rank: payload.rank,
        required: payload.required,
        uid: payload.uid,
        name: payload.name,
        options: options,
        displayprice: displayPrice,
      };
      const createdModifier = await CollectionService.create(
        modifierCollectionId,
        apiKey,
        fieldData,
      );
      if (!createdModifier.error) {
        await prisma.modifier.create({
          data: {
            webflowModifierId: createdModifier.data.id,
            siteId: siteId,
            gotabModifieruid: payload.uid,
          },
        });
        await optionuids?.map(async (ele: any) => {
          const middlewareOption = await prisma.option.findUnique({
            where: { gotabOptionuid: ele, siteId: siteId },
          });
          if (middlewareOption) {
            prisma.option.update({
              where: { gotabOptionuid: ele, siteId: siteId },
              data: { gotabModifieruid: payload.uid },
            });
          }
        });

        return getSuccessResponse('success', createdModifier);
      } else {
        return createdModifier;
      }
    } catch (error: any) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(error);
    }
  };

  public static update = async (
    apiKey: string,
    modifierCollectionId: any,
    payload: any,
    middlewareModifier: any,
  ) => {
    try {
      const optionuids =
        payload.options != null
          ? payload.options?.map((ele: any) => ele.uid)
          : null;
      const options =
        payload.options !== null
          ? await OptionService.getByOptionUid(
              optionuids,
              middlewareModifier?.Site?.id,
            )
          : null;
      const displayPrice = await convertToDollars(payload.price);
      const fieldData = {
        variant: payload.variant,
        enabled: payload.enabled,
        key: payload.key,
        price: payload.price,
        rank: payload.rank,
        required: payload.required,
        uid: payload.uid,
        name: payload.name,
        options: options,
        displayprice: displayPrice,
      };

      const updatedModifier = await CollectionService.update(
        modifierCollectionId,
        middlewareModifier?.webflowModifierId,
        apiKey,
        fieldData,
      );
      if (!updatedModifier.error) {
        await optionuids?.map(async (ele: any) => {
          const middlewareOption = await prisma.option.findUnique({
            where: {
              gotabOptionuid: ele,
              siteId: middlewareModifier?.Site?.id,
            },
          });
          if (middlewareOption) {
            await prisma.option.update({
              where: {
                gotabOptionuid: ele,
                siteId: middlewareModifier?.Site?.id,
              },
              data: { gotabModifieruid: payload.uid },
            });
          }
        });
        return getSuccessResponse('success', updatedModifier);
      } else {
        return updatedModifier;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse('Error updating ModifierUuid' + payload.uid);
    }
  };

  //method to add updated modifiers to product
  public static addModifiersToWebflowProduct = async (
    apiKey: string,
    gotabProductUuid: any,
    siteId: any,
  ) => {
    //getting all the modifiers of a product that has isDeleted  false
    const mappedModifiersToProductFromProductModifiers =
      await prisma.productModifier.findMany({
        where: {
          gotabProductUuid: gotabProductUuid,
          isDeleted: false,
          siteId: siteId,
        },
      });
    const mappedModifiers = mappedModifiersToProductFromProductModifiers.map(
      (ele: any) => ele.gotabModifieruid,
    );
    const modifiers = await prisma.modifier.findMany({
      where: {
        gotabModifieruid: {
          in: mappedModifiers,
        },
        siteId: siteId,
      },
    });
    const webflowModifierIdsOfProduct = modifiers.map((ele: any) => {
      return ele.webflowModifierId;
    });
    const middlewareProduct = await prisma.product.findUnique({
      include: {
        Site: true,
      },
      where: {
        productUuid: gotabProductUuid,
      },
    });
    let fieldData = { modifiers: webflowModifierIdsOfProduct };
    const updatedProduct = await CollectionService.update(
      middlewareProduct?.Site?.webflowProductCollectionId as string,
      middlewareProduct?.webflowProductId,
      apiKey,
      fieldData,
    );
    if (!updatedProduct.error) {
      return getSuccessResponse('success', updatedProduct);
    } else {
      return updatedProduct;
    }
  };

  public static delete = async (
    apiKey: string,
    collectionId: any,
    payload: any,
    siteId: any,
  ) => {
    try {
      const middlewareModifier = await prisma.modifier.findUnique({
        where: { gotabModifieruid: payload.gotabModifieruid, siteId: siteId },
      });
      const updateModifierinMiddlewareDb =
        await prisma.productModifier.findMany({
          where: { gotabModifieruid: payload.gotabModifieruid, siteId: siteId },
        });
      const mappedModifieruidsOfProduct = updateModifierinMiddlewareDb.map(
        (ele: any) => ele.gotabProductUuid,
      );
      const updateproductModifiersinMiddleware =
        await prisma.productModifier.updateMany({
          where: {
            gotabModifieruid: payload?.gotabModifieruid,
            siteId: siteId,
          },
          data: { isDeleted: true },
        });
      let promise = new Promise((resolve: any, reject: any) => {
        if (mappedModifieruidsOfProduct.length === 0) {
          resolve();
        }
        mappedModifieruidsOfProduct.forEach(
          async (ele: any, index: any, array: any) => {
            const addedUpdatedModifiersOfProduct =
              await this.addModifiersToWebflowProduct(
                apiKey as string,
                ele,
                siteId,
              );
            if (!addedUpdatedModifiersOfProduct.error) {
              if (index === array.length - 1) {
                resolve();
              }
            } else {
              reject(addedUpdatedModifiersOfProduct);
              return false;
            }
          },
        );
      });
      promise
        .then(async () => {
          const deletedModifier = await CollectionService.delete(
            collectionId,
            middlewareModifier?.webflowModifierId,
            apiKey,
          );
          if (!deletedModifier.error) {
            const removedModifier = await CollectionService.remove(
              collectionId,
              middlewareModifier?.webflowModifierId,
              apiKey,
            );
            if (!removedModifier.error) {
              await prisma.modifier.delete({
                where: {
                  gotabModifieruid: payload?.gotabModifieruid,
                  siteId: siteId,
                },
              });
              await prisma.productModifier.deleteMany({
                where: {
                  gotabModifieruid: payload?.gotabModifieruid,
                  siteId: siteId,
                },
              });
            } else {
              return removedModifier;
            }
          } else {
            return deletedModifier;
          }
        })
        .catch((error) => {
          return getErrorResponse('error in deleting a Modifier', error);
        });
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse('Error deleting modifier' + payload.uid);
    }
  };
  public static sync = async (
    apiKey: string,
    modifierCollectionId: any,
    payload: any,
    siteId: number,
  ) => {
    try {
      const middlewareModifier = await prisma.modifier.findUnique({
        where: { gotabModifieruid: payload.uid },
      });
      if (!middlewareModifier && payload.enabled) {
        const decryptedApiKey = EncryptionClient.decryptData(apiKey as string);
        return this.create(
          decryptedApiKey,
          modifierCollectionId,
          payload,
          siteId,
        );
      } else {
        if (payload.enabled) {
          return this.update(
            apiKey,
            modifierCollectionId,
            payload,
            middlewareModifier,
          );
        } else
          return this.delete(apiKey, modifierCollectionId, payload, siteId);
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error syncing ModifierUuid' + payload.uid + ' for siteId' + siteId,
      );
    }
  };

  //method to fetch all the modifiers associated to this product from middleware
  public static async getByModifierUid(modifiers: any, siteId: any) {
    const modifiersList = await prisma.modifier.findMany({
      where: {
        gotabModifieruid: {
          in: modifiers,
        },
        siteId: siteId,
      },
    });
    const finalModifiersList = modifiersList.map(
      (ele: any) => ele.webflowModifierId,
    );
    return finalModifiersList;
  }
}
