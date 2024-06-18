import AddSiteRequest from '@/server/request/addSiteRequest';
import config from '@/server/serverUtils/config';
import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import logger from '@/server/serverUtils/logger';
import UserService from '@/server/services/userService';
import prisma from '@/lib/prisma';

import { getCollectionsBySiteId } from '@/server/serverUtils/webflowHelpers';
import AwsEmailClient from '@/server/serverUtils/AwsClient/emailClient';

import { getLocation } from '../goTabService/graphApiQueries/location';
import { getProducts } from '../goTabService/graphApiQueries/product';
import { getOptions } from '../goTabService/graphApiQueries/option';
import { getModifiers } from '../goTabService/graphApiQueries/modifier';
import { getCategories } from '../goTabService/graphApiQueries/category';
import { getMenus } from '../goTabService/graphApiQueries/menu';

import { getVariants } from '../goTabService/graphApiQueries/variant';

import _, { isEmpty } from 'lodash';
import AddressService from '../addressService';
import LocationService from '../locationService';
import OptionService from '../optionService';
import VarientService from '../varientService';
import ModifierService from '../modifierService';
import ProductService from '../productService';
import CategoryService from '../categoryService';
import MenuService from '../menuService';
import CollectionService from '../collectionService';
import varientService from '../varientService';
import EncryptionClient from '@/server/serverUtils/EncryptionClient';
import ErrorLog from '../errorLog';

export const importData = async (
  payload: any,
  siteId: any,
  collections: any,
) => {
  const goTabLocationData = await getLocation(payload.locationUuid);
  if (!goTabLocationData.error) {
    //Adding Address details to webflow
    const addAddressToWebflow = await AddressService.create(
      payload.apiKey,
      collections.addressCollectionId,
      goTabLocationData.data.address,
      siteId,
    );
    if (!addAddressToWebflow.error) {
      console.log('address', addAddressToWebflow);
      //adding location details to webflow
      const addLocationToWebflow = await LocationService.create(
        payload.apiKey,
        collections.locationCollectionId,
        goTabLocationData.data,
        addAddressToWebflow.data.data.id,
        siteId,
      );
      if (!addLocationToWebflow.error) {
        console.log('location', addLocationToWebflow);
        //fetching gotab data
        const filteredOptionsArray = await getOptions(
          goTabLocationData.data.locationId,
        );
        const filteredVariantsArray = await getVariants(
          goTabLocationData.data.locationId,
        );
        const filteredModifiersArray = await getModifiers(
          goTabLocationData.data.locationId,
        );
        const filteredProductsArray = await getProducts(
          goTabLocationData.data.locationId,
        );
        const filteredCategoriesArray = await getCategories(
          goTabLocationData.data.locationId,
        );
        const filteredMenusArray = await getMenus(
          goTabLocationData.data.locationId,
        );
        if (
          !filteredProductsArray.error &&
          !filteredCategoriesArray.error &&
          !filteredMenusArray.error &&
          !filteredModifiersArray.error &&
          !filteredOptionsArray.error
        ) {
          //const promiseList: Promise<any>[] = [];

          let promise1 = new Promise((resolve: any, reject: any) => {
            if (filteredOptionsArray.data.length == 0) {
              resolve();
            }
            console.log('options', filteredOptionsArray.data.length);
            filteredOptionsArray.data.forEach(
              async (ele: any, index: any, array: any) => {
                setTimeout(async () => {
                  const addOptionsToWebflow = await OptionService.create(
                    payload.apiKey as string,
                    collections.optionCollectionId,
                    ele,
                    siteId,
                  );
                  if (!addOptionsToWebflow.error) {
                    if (index === array.length - 1) {
                      resolve();
                    }
                  } else {
                    reject(addOptionsToWebflow);
                    return false;
                  }
                }, index * 1000);
              },
            );
          });

          //promiseList.push(promise1);

          promise1
            .then(async () => {
              let promise2 = new Promise((resolve: any, reject: any) => {
                if (filteredModifiersArray.data.length == 0) {
                  resolve();
                }
                console.log('modifiers', filteredModifiersArray.data.length);
                filteredModifiersArray.data.forEach(
                  async (ele: any, index: any, array: any) => {
                    setTimeout(async () => {
                      const addModifiersToWebflow =
                        await ModifierService.create(
                          payload.apiKey as string,
                          collections.modifierCollectionId,
                          ele,
                          siteId,
                        );
                      if (!addModifiersToWebflow.error) {
                        if (index === array.length - 1) {
                          resolve();
                        }
                      } else {
                        reject(addModifiersToWebflow);
                        return false;
                      }
                    }, index * 1000);
                  },
                );
              });

              // promiseList.push(promise2);
              promise2
                .then(async () => {
                  let promise3 = new Promise((resolve: any, reject: any) => {
                    if (filteredVariantsArray.data.length == 0) {
                      resolve();
                    }
                    console.log('variants', filteredVariantsArray.data.length);
                    filteredVariantsArray.data.forEach(
                      async (ele: any, index: any, array: any) => {
                        setTimeout(async () => {
                          const addVariantsToWebflow =
                            await varientService.create(
                              payload.apiKey as string,
                              collections.variantCollectionId,
                              ele,
                              siteId,
                            );
                          if (!addVariantsToWebflow.error) {
                            if (index === array.length - 1) {
                              resolve();
                            }
                          } else {
                            reject(addVariantsToWebflow);
                            return false;
                          }
                        }, index * 1000);
                      },
                    );
                  });

                  // promiseList.push(promise3);
                  promise3
                    .then(async () => {
                      let promise4 = new Promise(
                        (resolve: any, reject: any) => {
                          if (filteredProductsArray.data.length == 0) {
                            resolve();
                          }
                          console.log(
                            'products',
                            filteredProductsArray.data.length,
                          );
                          filteredProductsArray.data.forEach(
                            async (ele: any, index: any, array: any) => {
                              setTimeout(async () => {
                                const addProductsToWebflow =
                                  await ProductService.create(
                                    payload.apiKey as string,
                                    collections.productCollectionId,
                                    ele,
                                    siteId,
                                    payload.locationUuid,
                                  );
                                if (!addProductsToWebflow.error) {
                                  if (index === array.length - 1) {
                                    resolve();
                                  }
                                } else {
                                  reject(addProductsToWebflow);
                                  return false;
                                }
                              }, index * 1000);
                            },
                          );
                        },
                      );

                      // promiseList.push(promise4);
                      promise4
                        .then(() => {
                          let promise5 = new Promise(
                            (resolve: any, reject: any) => {
                              if (filteredCategoriesArray.data.length == 0) {
                                resolve();
                              }
                              console.log(
                                'categories',
                                filteredCategoriesArray.data.length,
                              );
                              filteredCategoriesArray.data.forEach(
                                async (ele: any, index: any, array: any) => {
                                  setTimeout(async () => {
                                    const addCategoriesToWebflow =
                                      await CategoryService.create(
                                        payload.apiKey as string,
                                        collections.categoryCollectionId,
                                        ele,
                                        siteId,
                                        payload.locationUuid,
                                      );
                                    if (!addCategoriesToWebflow?.error) {
                                      if (index === array.length - 1) {
                                        resolve();
                                      }
                                    } else {
                                      reject(addCategoriesToWebflow);
                                      return false;
                                    }
                                  }, index * 1000);
                                },
                              );
                            },
                          );

                          //promiseList.push(promise5);
                          promise5
                            .then(() => {
                              let promise6 = new Promise(
                                (resolve: any, reject: any) => {
                                  if (filteredMenusArray.data.length == 0) {
                                    resolve();
                                  }
                                  console.log(
                                    'menus',
                                    filteredMenusArray.data.length,
                                  );
                                  filteredMenusArray.data.forEach(
                                    async (
                                      ele: any,
                                      index: any,
                                      array: any,
                                    ) => {
                                      setTimeout(async () => {
                                        const addMenusToWebflow =
                                          await MenuService.create(
                                            payload.apiKey as string,
                                            collections.menuCollectionId,
                                            ele,
                                            siteId,
                                            payload.locationUuid,
                                          );
                                        if (!addMenusToWebflow?.error) {
                                          if (index === array.length - 1) {
                                            resolve();
                                          }
                                        } else {
                                          reject(addMenusToWebflow);
                                          return false;
                                        }
                                      }, index * 1000);
                                    },
                                  );
                                },
                              );

                              // promiseList.push(promise6);
                              promise6
                                .then(async (data) => {
                                  await AwsEmailClient.sendMailUsingMailer({
                                    to: 'dev@ionixsystems.com',
                                    subject: 'Import Success',
                                    html: `
                                  <div>
                                  <h3>Success</h3>
                                  <p>Data Imported Successfully</p>
                                   </div>
                                  `,
                                  });
                                  return data;
                                })
                                .catch(async (error) => {
                                  console.log('menus-catch', error);
                                  const errorMsg = `${error?.errors?.response.data.message} while adding Menu`;
                                  await ErrorLog.logErrorToDb(
                                    error?.errors?.response.data.code,
                                    errorMsg,
                                    siteId,
                                    payload,
                                    error?.errors?.response.config,
                                  );
                                  return getErrorResponse(
                                    errorMsg,
                                    error?.errors?.response,
                                  );
                                });
                            })
                            .catch(async (error) => {
                              console.log('category-catch', error);
                              const errorMsg = `${error?.errors?.response.data.message} while adding categories`;
                              await ErrorLog.logErrorToDb(
                                error?.errors?.response.data.code,
                                errorMsg,
                                siteId,
                                payload,
                                error?.errors?.response.config,
                              );
                              return getErrorResponse(
                                errorMsg,
                                error?.errors?.response,
                              );
                            });
                        })
                        .catch(async (error) => {
                          console.log('products-catch', error);
                          const errorMsg = `${error?.errors?.response.data.message} while adding products`;
                          await ErrorLog.logErrorToDb(
                            error?.errors?.response.data.code,
                            errorMsg,
                            siteId,
                            payload,
                            error?.errors?.response.config,
                          );
                          return getErrorResponse(
                            errorMsg,
                            error?.errors?.response,
                          );
                        });
                    })
                    .catch(async (error) => {
                      console.log('variants-catch', error);
                      const errorMsg = `${error?.errors?.response.data.message} while adding variants`;
                      await ErrorLog.logErrorToDb(
                        error?.errors?.response.data.code,
                        errorMsg,
                        siteId,
                        payload,
                        error?.errors?.response.config,
                      );
                      return getErrorResponse(
                        errorMsg,
                        error?.errors?.response,
                      );
                    });
                })
                .catch(async (error) => {
                  console.log('modifiers-catch', error);
                  const errorMsg = `${error?.errors?.response.data.message} while adding modifiers`;
                  await ErrorLog.logErrorToDb(
                    error?.errors?.response.data.code,
                    errorMsg,
                    siteId,
                    payload,
                    error?.errors?.response.config,
                  );
                  return getErrorResponse(errorMsg, error?.errors?.response);
                });
            })
            .catch(async (error) => {
              console.log('options-catch', error);
              const errorMsg = ` while adding options, ${error?.errors?.response.data.message}`;
              await ErrorLog.logErrorToDb(
                error?.errors?.response.data.code,
                errorMsg,
                siteId,
                payload,
                error?.errors?.config,
              );
              return getErrorResponse(errorMsg, error?.errors?.response);
            });

          //   try {
          //     await Promise.all(promiseList);
          //   } catch (e) {
          //     console.error(e.errors);
          //     return getErrorResponse(e);
          //   }
        } else {
          console.log('schemamismatch-catch');
          await ErrorLog.logErrorToDb(
            'Schema Mismatch/property not found',
            'Schema Mismatch/property not found',
            siteId,
            payload,
          );
          return getErrorResponse(
            'Error may be occured due to server error or schema mismatch or property not found',
          );
        }
      } else {
        console.log('location-error', addLocationToWebflow);
        const errMsg = `Error in inserting Location, ${addLocationToWebflow.errors.response.data.message}`;
        await ErrorLog.logErrorToDb(
          addLocationToWebflow.errors.response.data.code,
          errMsg,
          siteId,
          payload,
          addLocationToWebflow.errors.config,
        );
        return getErrorResponse(errMsg, addLocationToWebflow);
      }
    } else {
      console.log('address-error', addAddressToWebflow);
      const errMsg = `Error in inserting Address, ${addAddressToWebflow.errors.response.data.message}`;
      await ErrorLog.logErrorToDb(
        addAddressToWebflow.errors.response.data.code,
        errMsg,
        siteId,
        payload,
        addAddressToWebflow.errors.config,
      );
      return getErrorResponse(errMsg, addAddressToWebflow);
    }
  }
};
