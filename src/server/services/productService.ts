import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import CollectionService from './collectionService';
import prisma from '@/lib/prisma';
import logger from '../serverUtils/logger';
import ModifierService from './modifierService';
import VarientService from './varientService';
import CategoryService from './categoryService';

import EncryptionClient from '../serverUtils/EncryptionClient';
import {
  convertToDollars,
  markDownToHTML,
} from '../serverUtils/webflowHelpers';

export default class ProductService {
  public static create = async (
    apiKey: string,
    productCollectionId: any,
    payload: any,
    siteId: number,
  ) => {
    try {
      const modifieruids = payload?.modifiers?.map((ele: any) => ele.uid);
      const modifiers = await ModifierService.getByModifierUid(
        modifieruids,
        siteId,
      );
      const variantskus = payload?.variantsList?.map((ele: any) => ele.sku);
      const variants = await VarientService.getByVarientSku(
        variantskus,
        siteId,
      );
      const displayPrice = await convertToDollars(payload.basePrice);
      const newdesc = await markDownToHTML(payload.description);
      let fieldData = {
        available: payload.available,
        hasvariants: payload.hasvariants,
        baseprice: payload.basePrice,
        name: payload.name,
        description: payload.description,
        productdescription: newdesc,
        displayprice: displayPrice,
        producttype: payload.productType,
        productuuid: payload.productUuid,
        image: { url: payload?.images?.xl?.url },
        modifiers: modifiers,
        variants: variants,
      };
      const createdProduct = await CollectionService.create(
        productCollectionId,
        apiKey,
        fieldData,
      );
      if (!createdProduct.error) {
        await prisma.product.create({
          data: {
            webflowProductId: createdProduct.data.id,
            productUuid: payload.productUuid,
            siteId: siteId,
            gotabProductId: payload.productId,
            gotabCategoryId: payload.categoryId,
          },
        });
        await modifieruids?.map(async (ele: any) => {
          const middlewareModifier = await prisma.productModifier.findMany({
            where: {
              gotabModifieruid: ele,
              gotabProductUuid: payload.productUuid,
              siteId: siteId,
            },
          });
          if (middlewareModifier.length === 0) {
            await prisma.productModifier.create({
              data: {
                gotabModifieruid: ele,
                gotabProductUuid: payload.productUuid,
                siteId: siteId,
              },
            });
          }
        });
        await variantskus?.map(async (ele: any) => {
          const middlewareVariant = await prisma.variant.findUnique({
            where: { gotabVariantsku: ele, siteId: siteId },
          });
          if (middlewareVariant) {
            await prisma.variant.update({
              where: { gotabVariantsku: ele, siteId: siteId },
              data: { gotabProductUuid: payload.productUuid },
            });
          }
        });

        return getSuccessResponse('success', createdProduct);
      } else {
        return createdProduct;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse();
    }
  };

  public static update = async (
    apiKey: any,
    collectionId: string,
    payload: any,
    middlewareProduct: any,
  ) => {
    try {
      const modifieruids = payload?.modifiers?.map((ele: any) => ele.uid);
      const modifiers = await ModifierService.getByModifierUid(
        modifieruids,
        middlewareProduct?.Site?.id,
      );
      const variantskus = payload.variantsList.map((ele: any) => ele.sku);
      const variants = await VarientService.getByVarientSku(
        variantskus,
        middlewareProduct?.Site?.id,
      );
      const displayPrice = await convertToDollars(payload.basePrice);
      const newdesc = await markDownToHTML(payload.description);

      let fieldData = {
        available: payload.available,
        hasvariants: payload.hasvariants,
        baseprice: payload.basePrice,
        name: payload.name,
        description: payload.description,
        productdescription: newdesc,
        displayprice: displayPrice,
        producttype: payload.productType,
        productuuid: payload.productUuid,
        image: { url: payload?.images?.xl?.url },
        modifiers: modifiers,
        variants: variants,
      };

      const updatedProduct = await CollectionService.update(
        collectionId,
        middlewareProduct?.webflowProductId,
        apiKey,
        fieldData,
      );
      if (!updatedProduct.error) {
        await modifieruids?.map(async (ele: any) => {
          const middlewareModifier = await prisma.productModifier.findMany({
            where: {
              gotabModifieruid: ele,
              siteId: middlewareProduct?.Site?.id,
            },
          });
          if (middlewareModifier.length === 0) {
            await prisma.productModifier.create({
              data: {
                gotabModifieruid: ele,
                gotabProductUuid: payload.productUuid,
                siteId: middlewareProduct?.Site?.id,
              },
            });
          }
        });
        await variantskus?.map(async (ele: any) => {
          const middlewareVariant = await prisma.variant.findUnique({
            where: {
              gotabVariantsku: ele,
              siteId: middlewareProduct?.Site?.id,
            },
          });
          if (middlewareVariant) {
            await prisma.variant.update({
              where: {
                gotabVariantsku: ele,
                siteId: middlewareProduct?.Site?.id,
              },
              data: { gotabProductUuid: payload.productUuid },
            });
          }
        });
        return getSuccessResponse('success', updatedProduct);
      } else {
        return updatedProduct;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error updating ProductUuid' + payload.productUuid,
      );
    }
  };

  public static delete = async (
    apiKey: any,
    collectionId: string,
    payload: any,
    siteId: any,
  ) => {
    try {
      const product = await prisma.product.update({
        where: { productUuid: payload.productUuid, siteId: siteId },
        data: { isDeleted: true },
      });
      if (product) {
        const categoryProducts = await this.getByCategoryId(
          product.gotabCategoryId,
          siteId,
        );
        const removeProductFromCategory =
          await CategoryService.updateCategoryProducts(
            apiKey,
            categoryProducts,
            product?.gotabCategoryId as string,
          );
        if (!removeProductFromCategory.error) {
          const deletedProduct = await CollectionService.delete(
            collectionId,
            product.webflowProductId,
            apiKey,
          );
          if (!deletedProduct.error) {
            const removedProduct = await CollectionService.remove(
              collectionId,
              product.webflowProductId,
              apiKey,
            );
            if (!removedProduct.error) {
              await prisma.product.delete({
                where: { productUuid: payload.productUuid },
              });
              await prisma.productModifier.deleteMany({
                where: {
                  gotabProductUuid: payload?.productUuid,
                  siteId: siteId,
                },
              });
              return getSuccessResponse(
                'success',
                'Deleted Product Successully',
              );
            } else {
              return removedProduct;
            }
          } else {
            return deletedProduct;
          }
        } else {
          return removeProductFromCategory;
        }
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error deleting ProductUid' + payload.productUuid,
      );
    }
  };

  public static sync = async (
    apiKey: string,
    productCollectionId: any,
    payload: any,
    siteId: number,
  ) => {
    try {
      const middlewareProduct = await prisma.product.findUnique({
        where: { productUuid: payload.productUuid, siteId: siteId },
      });
      if (!middlewareProduct && payload.available) {
        const decryptedApiKey = EncryptionClient.decryptData(apiKey as string);
        return this.create(
          decryptedApiKey,
          productCollectionId,
          payload,
          siteId,
        );
      } else {
        if (payload.available)
          return this.update(
            apiKey,
            productCollectionId,
            payload,
            middlewareProduct,
          );
        else return this.delete(apiKey, productCollectionId, payload, siteId);
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error syncing ProductUuid' +
          payload.productUuid +
          ' for siteId' +
          siteId,
      );
    }
  };

  //method to fetch all the products associated to a category from middleware db
  public static async getByProductUid(products: any, siteId: any) {
    const productsList = await prisma.product.findMany({
      where: {
        productUuid: {
          in: products,
        },
        siteId: siteId,
      },
    });
    const finalProductsList = productsList.map(
      (ele: any) => ele.webflowProductId,
    );
    return finalProductsList;
  }
  //method to fetch all the products associated to a category from middleware db
  public static async getByCategoryId(gotabCategoryId: any, siteId: any) {
    const products = await prisma.product.findMany({
      where: {
        gotabCategoryId: gotabCategoryId,
        isDeleted: false,
        siteId: siteId,
      },
    });
    const productsIds = products.map((ele: any) => ele.webflowProductId);
    return productsIds;
  }
}
