import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import CollectionService from './collectionService';
import prisma from '@/lib/prisma';
import logger from '../serverUtils/logger';
import EncryptionClient from '../serverUtils/EncryptionClient';
import { convertToDollars } from '../serverUtils/webflowHelpers';
export default class VarientService {
  public static create = async (
    apiKey: string,
    variantCollectionId: any,
    payload: any,
    siteId: number,
  ) => {
    try {
      const displayPrice = await convertToDollars(payload.price);
      const fieldData = {
        price: payload.price,
        sku: payload.sku,
        name: payload.name,
        displayprice: displayPrice,
      };

      const createdVariant = await CollectionService.create(
        variantCollectionId,
        apiKey,
        fieldData,
      );
      if (!createdVariant.error) {
        await prisma.variant.create({
          data: {
            webflowVariantId: createdVariant.data.id,
            siteId: siteId,
            gotabVariantsku: payload.sku,
          },
        });
        return getSuccessResponse('success', createdVariant);
      } else {
        return getErrorResponse('error in variants', createdVariant);
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error adding Varientsku' + payload.sku + ' for siteId' + siteId,
      );
    }
  };
  public static update = async (
    apiKey: string,
    variantCollectionId: any,
    payload: any,
    middlewareVariant: any,
  ) => {
    try {
      const displayPrice = await convertToDollars(payload.price);
      const fieldData = {
        price: payload.price,
        sku: payload.sku,
        name: payload.name,
        displayprice: displayPrice,
      };
      const updatedVariant = await CollectionService.update(
        variantCollectionId,
        middlewareVariant?.webflowVariantId,
        apiKey,
        fieldData,
      );
      if (!updatedVariant.error) {
        return getSuccessResponse('success', updatedVariant);
      } else {
        return updatedVariant;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse('Error updating Varientsku' + payload.sku);
    }
  };

  //method to add updated variants to products
  public static addVariantsToWebflowProduct = async (
    apiKey: string,
    gotabProductUuid: any,
    siteId: any,
  ) => {
    //fetching all the variants of a product that has isDeleted to false
    const mappedVariantsToProduct = await prisma.variant.findMany({
      where: {
        gotabProductUuid: gotabProductUuid,
        isDeleted: false,
        siteId: siteId,
      },
    });
    //mapping them to get webflowIds
    const webflowVariantIdsOfProduct = mappedVariantsToProduct.map(
      (ele: any) => {
        return ele.webflowVariantId;
      },
    );
    //fetching middleware product data
    const middlewareProduct = await prisma.product.findUnique({
      include: {
        Site: true,
      },
      where: {
        productUuid: gotabProductUuid,
      },
    });
    let fieldData = { variantslist: webflowVariantIdsOfProduct };
    //updating the product with updated variants
    const updatedProduct = await CollectionService.update(
      middlewareProduct?.Site?.webflowProductCollectionId as string,
      middlewareProduct?.webflowProductId,
      apiKey,
      fieldData,
    );
    if (!updatedProduct.error) {
      return getSuccessResponse(
        'Variants updated to a Product Successfully',
        updatedProduct,
      );
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
      //fetching middleware variant result
      const middlewareVariant = await prisma.variant.findUnique({
        where: { gotabVariantsku: payload.gotabVariantsku, siteId: siteId },
      });
      //updating the variant as isDeleted to true
      const updateVariantinMiddlewareDb = await prisma.variant.update({
        where: { id: middlewareVariant?.id, siteId: siteId },
        data: { isDeleted: true },
      });
      if (updateVariantinMiddlewareDb) {
        //adding updated variants to product
        const removeVariantFromProduct = await this.addVariantsToWebflowProduct(
          apiKey as string,
          middlewareVariant?.gotabProductUuid,
          siteId,
        );
        if (!removeVariantFromProduct.error) {
          //deleting a product
          const deletedVariant = await CollectionService.delete(
            collectionId,
            middlewareVariant?.webflowVariantId,
            apiKey,
          );
          if (!deletedVariant.error) {
            //removing a product
            const removedVariant = await CollectionService.remove(
              collectionId,
              middlewareVariant?.webflowVariantId,
              apiKey,
            );
            if (!removedVariant.error) {
              await prisma.variant.delete({
                where: { gotabVariantsku: payload?.gotabVariantsku },
              });
            } else {
              return removedVariant;
            }
          } else {
            return deletedVariant;
          }
        } else {
          return removeVariantFromProduct;
        }
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse('Error deleting Varientsku' + payload.sku);
    }
  };

  public static sync = async (
    apiKey: string,
    variantCollectionId: any,
    payload: any,
    siteId: number,
  ) => {
    try {
      const middlewareVariant = await prisma.variant.findUnique({
        where: { gotabVariantsku: payload.sku, siteId: siteId },
        include: { Site: true },
      });
      if (!middlewareVariant && payload.archived === null) {
        const decryptedApiKey = EncryptionClient.decryptData(apiKey as string);
        return this.create(
          decryptedApiKey,
          variantCollectionId,
          payload,
          siteId,
        );
      } else {
        if (payload.archived === null) {
          return this.update(
            apiKey,
            variantCollectionId,
            payload,
            middlewareVariant,
          );
        } else this.delete(apiKey, variantCollectionId, payload, siteId);
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error syncing Varientsku' + payload.sku + ' for siteId' + siteId,
      );
    }
  };

  //method to fetch all the variants associated to this product from middleware
  public static async getByVarientSku(variants: any, siteId: any) {
    const variantsList = await prisma.variant.findMany({
      where: {
        gotabVariantsku: {
          in: variants,
        },
        siteId: siteId,
      },
    });
    const finalVariantsList = variantsList.map(
      (ele: any) => ele.webflowVariantId,
    );
    return finalVariantsList;
  }
}
