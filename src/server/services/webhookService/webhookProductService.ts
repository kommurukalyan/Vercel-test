import prisma from '@/lib/prisma';
import logger from '@/server/serverUtils/logger';
import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';

import _ from 'lodash';

import { getProductById } from '../goTabService/graphApiQueries/product';
import OptionService from '../optionService';
import ModifierService from '../modifierService';
import varientService from '../varientService';
import ProductService from '../productService';
import CategoryService from '../categoryService';
import EncryptionClient from '@/server/serverUtils/EncryptionClient';
import ErrorLog from '../errorLog';
import { MiddlewareArray } from '@reduxjs/toolkit';

export default class WebhookProductService {
  //method that triggers when product webhook is trigerred
  public static updateWebhookProduct = async (payload: any) => {
    try {
      const goTabProductResult = await getProductById(payload.target_id);
      const locationDetails = await prisma.location.findUnique({
        include: {
          Site: true,
        },
        where: {
          locationUuid: payload.location_uuid,
        },
      });
      if (!goTabProductResult.error) {
        //fetching the product details from middleware db
        const middlewareProduct = await prisma.product.findUnique({
          include: {
            Site: true,
          },
          where: {
            productUuid: payload.target_uuid,
          },
        });
        if (middlewareProduct) {
          //fetching the gotab product data by id
          const goTabProductResult = await getProductById(payload.target_id);
          //checking if the product is not deleted
          if (middlewareProduct.isDeleted == false) {
            //checking if the product is available
            if (
              goTabProductResult &&
              goTabProductResult.data.product.available === true
            ) {
              let promise1 = new Promise((resolve: any, reject: any) => {
                if (goTabProductResult.data.options.length === 0) {
                  resolve();
                }
                goTabProductResult.data.options.every(
                  async (ele: any, index: any, array: any) => {
                    setTimeout(async () => {
                      const updateOptionsToWebflow = await OptionService.sync(
                        middlewareProduct?.Site?.apiKey as string,
                        middlewareProduct?.Site?.webflowOptionCollectionId,
                        ele,
                        middlewareProduct?.Site?.id as number,
                      );
                      if (!updateOptionsToWebflow?.error) {
                        if (index === array.length - 1) {
                          resolve();
                        }
                      } else {
                        reject(updateOptionsToWebflow);
                        return false;
                      }
                    }, index * 1000);
                  },
                );
              });
              promise1
                .then(async () => {
                  let promise2 = new Promise((resolve: any, reject: any) => {
                    if (goTabProductResult.data.modifiers.length === 0) {
                      resolve();
                    }
                    goTabProductResult.data.modifiers.every(
                      async (ele: any, index: any, array: any) => {
                        setTimeout(async () => {
                          const updateModifiersToWebflow =
                            await ModifierService.sync(
                              middlewareProduct?.Site?.apiKey as string,
                              middlewareProduct?.Site
                                ?.webflowModifierCollectionId,
                              ele,
                              middlewareProduct?.Site?.id as number,
                            );
                          if (!updateModifiersToWebflow?.error) {
                            if (index === array.length - 1) {
                              resolve();
                            }
                          } else {
                            reject(updateModifiersToWebflow);
                            return false;
                          }
                        }, index * 1000);
                      },
                    );
                  });
                  promise2
                    .then(async () => {
                      let promise3 = new Promise(
                        (resolve: any, reject: any) => {
                          if (goTabProductResult.data.variants.length === 0) {
                            resolve();
                          }
                          goTabProductResult.data.variants.every(
                            async (ele: any, index: any, array: any) => {
                              setTimeout(async () => {
                                const updateVariantsToWebflow =
                                  await varientService.sync(
                                    middlewareProduct?.Site?.apiKey as string,
                                    middlewareProduct?.Site
                                      ?.webflowVariantCollectionId,
                                    ele,
                                    middlewareProduct?.Site?.id as number,
                                  );
                                if (!updateVariantsToWebflow?.error) {
                                  if (index === array.length - 1) {
                                    resolve();
                                  }
                                } else {
                                  reject(updateVariantsToWebflow);
                                  return false;
                                }
                              }, index * 1000);
                            },
                          );
                        },
                      );
                      promise3.then(async () => {
                        const updatedWebflowProduct =
                          await ProductService.update(
                            middlewareProduct?.Site?.apiKey,
                            middlewareProduct?.Site
                              ?.webflowProductCollectionId as string,
                            goTabProductResult.data.product,
                            middlewareProduct,
                          );
                        if (!updatedWebflowProduct.error) {
                          return getSuccessResponse(
                            '  product updated successfully ',
                            updatedWebflowProduct,
                          );
                        } else {
                          const errorMsg = `Error updating product during PRODUCT_UPDATED webhook ${updatedWebflowProduct.errors.response.data.message}`;
                          await ErrorLog.logErrorToDb(
                            updatedWebflowProduct.errors.response.data.code,
                            errorMsg,
                            middlewareProduct?.Site?.id,
                            middlewareProduct,
                          );
                          return getErrorResponse(
                            'Error updating product',
                            updatedWebflowProduct,
                          );
                        }
                      });
                    })
                    .catch(async (error: any) => {
                      const errorMsg = `${error?.errors?.response.data.message} while updating Modifiers during PRODUCT_UPDATED webhook`;
                      await ErrorLog.logErrorToDb(
                        error?.errors?.response.data.code,
                        errorMsg,
                        middlewareProduct?.Site?.id,
                        middlewareProduct,
                        error?.errors?.response.config,
                      );
                      return getErrorResponse(errorMsg, error);
                    });
                })
                .catch(async (error: any) => {
                  const errorMsg = `${error?.errors?.response.data.message} while updating Options during PRODUCT_UPDATED webhook`;
                  await ErrorLog.logErrorToDb(
                    error?.errors?.response.data.code,
                    errorMsg,
                    middlewareProduct?.Site?.id,
                    middlewareProduct,
                    error?.errors?.response.config,
                  );
                  return getErrorResponse(errorMsg, error);
                });
            } else {
              const deletedProduct = await ProductService.delete(
                middlewareProduct?.Site?.apiKey,
                middlewareProduct?.Site?.webflowProductCollectionId as string,
                goTabProductResult.data.product,
                middlewareProduct?.Site?.id,
              );
              if (!deletedProduct?.error) {
                return getSuccessResponse(
                  'Product is completely Removed Successfully as it is not available',
                );
              } else {
                const errorMsg = `Error deleting a product, ${deletedProduct.errors.response.data.message} during PRODUCT_UPDATED webhook`;
                await ErrorLog.logErrorToDb(
                  deletedProduct.errors.response.data.code,
                  errorMsg,
                  middlewareProduct?.Site?.id,
                  middlewareProduct,
                  deletedProduct?.errors?.response.config,
                );
                return getErrorResponse(
                  'Error deleting a product',
                  deletedProduct,
                );
              }
            }
          }
        } else {
          //if the product is not found in middleware it's a new product so adding it as a new product
          //fetching gotab product data by Id
          const goTabProductResult = await getProductById(payload.target_id);
          //fetching middleware location details from webhook payload locationuuid
          const locationDetails = await prisma.location.findUnique({
            include: {
              Site: true,
            },
            where: {
              locationUuid: payload.location_uuid,
            },
          });
          const decryptedApiKey = EncryptionClient.decryptData(
            locationDetails?.Site?.apiKey as string,
          );
          if (
            goTabProductResult &&
            goTabProductResult.data.product.available === true
          ) {
            if (
              goTabProductResult.data.options.length > 0 ||
              goTabProductResult.data.modifiers.length > 0 ||
              goTabProductResult.data.variants.length > 0
            ) {
              let promise1 = new Promise((resolve: any, reject: any) => {
                if (goTabProductResult.data.options.length === 0) {
                  resolve();
                }
                goTabProductResult.data.options.every(
                  async (ele: any, index: any, array: any) => {
                    setTimeout(async () => {
                      const updateOptionsToWebflow = await OptionService.sync(
                        locationDetails?.Site?.apiKey as string,
                        locationDetails?.Site?.webflowOptionCollectionId,
                        ele,
                        locationDetails?.Site?.id as number,
                      );
                      if (!updateOptionsToWebflow?.error) {
                        if (index === array.length - 1) {
                          resolve();
                        }
                      } else {
                        reject(updateOptionsToWebflow);
                        return false;
                      }
                    }, index * 1000);
                  },
                );
              });
              promise1
                .then(() => {
                  let promise2 = new Promise((resolve: any, reject: any) => {
                    if (goTabProductResult.data.modifiers.length === 0) {
                      resolve();
                    }
                    goTabProductResult.data.modifiers.every(
                      async (ele: any, index: any, array: any) => {
                        setTimeout(async () => {
                          const updateModifiersToWebflow =
                            await ModifierService.sync(
                              locationDetails?.Site?.apiKey as string,
                              locationDetails?.Site
                                ?.webflowModifierCollectionId,
                              ele,
                              locationDetails?.Site?.id as number,
                            );
                          if (!updateModifiersToWebflow?.error) {
                            if (index === array.length - 1) {
                              resolve();
                            }
                          } else {
                            reject(updateModifiersToWebflow);
                            return false;
                          }
                        }, index * 1000);
                      },
                    );
                  });
                  promise2.then(() => {
                    let promise3 = new Promise((resolve: any, reject: any) => {
                      if (goTabProductResult.data.variants.length === 0) {
                        resolve();
                      }
                      goTabProductResult.data.variants.forEach(
                        async (ele: any, index: any, array: any) => {
                          setTimeout(async () => {
                            const updateVraintsToWebflow =
                              await varientService.sync(
                                locationDetails?.Site?.apiKey as string,
                                locationDetails?.Site
                                  ?.webflowVariantCollectionId,
                                ele,
                                locationDetails?.Site?.id as number,
                              );
                            if (!updateVraintsToWebflow?.error) {
                              if (index === array.length - 1) {
                                resolve();
                              }
                            } else {
                              reject(updateVraintsToWebflow);
                              return false;
                            }
                          }, index * 1000);
                        },
                      );
                    });
                    promise3
                      .then(async () => {
                        const addedNewWebflowProduct =
                          await ProductService.create(
                            decryptedApiKey as string,
                            locationDetails?.Site
                              ?.webflowProductCollectionId as string,
                            goTabProductResult.data.product,
                            locationDetails?.Site?.id as number,
                          );
                        if (!addedNewWebflowProduct.error) {
                          const categoryProducts =
                            await ProductService.getByCategoryId(
                              goTabProductResult.data.product.categoryId,
                              locationDetails?.Site?.id,
                            );
                          const addNewProductToCategory =
                            await CategoryService.updateCategoryProducts(
                              locationDetails?.Site?.apiKey,
                              categoryProducts,
                              goTabProductResult.data.product.categoryId,
                            );
                          if (!addNewProductToCategory.error) {
                            return getSuccessResponse(
                              ' New  product added successfully ',
                              addedNewWebflowProduct,
                            );
                          } else {
                            const errorMsg = `Error updating product to a category during PRODUCT_UPDATED webhook, ${addNewProductToCategory.errors.response.data.message}`;
                            await ErrorLog.logErrorToDb(
                              addNewProductToCategory.errors.response.data.code,
                              errorMsg,
                              locationDetails?.Site?.id,
                              middlewareProduct,
                              addNewProductToCategory?.errors?.response.config,
                            );
                            return getErrorResponse(
                              'Error updating product to a category',
                              addNewProductToCategory,
                            );
                          }
                        } else {
                          const errorMsg = `Error creating a new product during PRODUCT_UPDATED webhook, ${addedNewWebflowProduct.errors.response.data.message}`;
                          await ErrorLog.logErrorToDb(
                            addedNewWebflowProduct.errors.response.data.code,
                            errorMsg,
                            locationDetails?.Site?.id,
                            middlewareProduct,
                            addedNewWebflowProduct?.errors?.response.config,
                          );
                          return getErrorResponse(
                            'Error creating a new product',
                            addedNewWebflowProduct,
                          );
                        }
                      })
                      .catch(async (error: any) => {
                        const errorMsg = `${error?.errors?.response.data.message} while updating Modifiers during PRODUCT_UPDATED webhook`;
                        await ErrorLog.logErrorToDb(
                          error?.errors?.response.data.code,
                          errorMsg,
                          locationDetails?.Site?.id,
                          locationDetails,
                          error?.errors?.response.config,
                        );
                        return getErrorResponse(errorMsg, error);
                      });
                  });
                })
                .catch(async (error: any) => {
                  const errorMsg = `${error?.errors?.response.data.message} while updating options during PRODUCT_UPDATED webhook`;
                  await ErrorLog.logErrorToDb(
                    error?.errors?.response.data.code,
                    errorMsg,
                    locationDetails?.Site?.id,
                    locationDetails,
                    error?.errors?.response.config,
                  );
                  return getErrorResponse(errorMsg, error);
                });
            } else {
              const addedNewWebflowProduct = await ProductService.create(
                decryptedApiKey as string,
                locationDetails?.Site?.webflowProductCollectionId as string,
                goTabProductResult.data.product,
                locationDetails?.Site?.id as number,
              );
              if (!addedNewWebflowProduct.error) {
                const categoryProducts = await ProductService.getByCategoryId(
                  goTabProductResult.data.product.categoryId,
                  locationDetails?.Site?.id,
                );
                const addNewProductToCategory =
                  await CategoryService.updateCategoryProducts(
                    locationDetails?.Site?.apiKey,
                    categoryProducts,
                    goTabProductResult.data.product.categoryId,
                  );
                if (!addNewProductToCategory.error) {
                  return getSuccessResponse(
                    ' New  product added successfully ',
                    addedNewWebflowProduct,
                  );
                } else {
                  const errorMsg = `Error updating product to a category during PRODUCT_UPDATED webhook, ${addNewProductToCategory.errors.response.data.message}`;
                  await ErrorLog.logErrorToDb(
                    addNewProductToCategory.errors.response.data.code,
                    errorMsg,
                    locationDetails?.Site?.id,
                    locationDetails,
                    addNewProductToCategory?.errors?.response.config,
                  );
                  return getErrorResponse(errorMsg, addNewProductToCategory);
                }
              } else {
                const errorMsg = `Error creating a new product during PRODUCT_UPDATED webhook,${addedNewWebflowProduct.errors.response.data.message}`;
                await ErrorLog.logErrorToDb(
                  addedNewWebflowProduct.errors.response.data.code,
                  errorMsg,
                  locationDetails?.Site?.id,
                  locationDetails,
                  addedNewWebflowProduct?.errors?.response.config,
                );
                return getErrorResponse(errorMsg, addedNewWebflowProduct);
              }
            }
          } else {
            return getErrorResponse(
              'not adding the product as it is not available',
            );
          }
        }
      } else {
        const errorMsg = `Error fetching gotabProduct result during PRODUCT_UPDATED webhook, ${goTabProductResult?.errors[0]?.message}`;
        await ErrorLog.logErrorToDb(
          'Schema Mismatch/property not found',
          errorMsg,
          locationDetails?.Site?.id,
          locationDetails,
        );
        return getErrorResponse(errorMsg, goTabProductResult);
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse();
    }
  };
}
