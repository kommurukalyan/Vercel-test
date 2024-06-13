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

export default class SiteService {
  public static getSites = async (userId: number) => {
    try {
      const user = await UserService.getUserById(userId);

      if (!user) {
        return getErrorResponse('Invalid userId');
      }
      const result = await prisma.site.findMany({
        include: { User: true },
        where: { isDeleted: false },
      });
      return getSuccessResponse('Success', result);
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse();
    }
  };
  public static createSite = async (
    payload: AddSiteRequest,
    userId: number,
  ) => {
    try {
      // testing whether the logged in user existed
      const user = await UserService.getUserById(userId);

      if (!user) {
        return getErrorResponse('Invalid userId');
      }
      // encrypting the apiKey
      const encryptedkey = EncryptionClient.encryptData(payload.apiKey);
      //a helper function is created to call all the collections of a site
      const collections = await getCollectionsBySiteId(
        payload.siteId,
        payload.apiKey,
      );

      if (!collections.error) {
        // filtering the collections based on collectionname
        const locationCollectionId = collections.data.filter(
          (ele: any) => ele.displayName === 'Locations',
        )[0].id;
        const addressCollectionId = collections.data.filter(
          (ele: any) => ele.displayName === 'Addresses',
        )[0].id;
        const menuCollectionId = collections.data.filter(
          (ele: any) => ele.displayName === 'Menus',
        )[0].id;
        const categoryCollectionId = collections.data.filter(
          (ele: any) => ele.displayName === 'Categories',
        )[0].id;
        const productCollectionId = collections.data.filter(
          (ele: any) => ele.displayName === 'Products',
        )[0].id;
        const modifierCollectionId = collections.data.filter(
          (ele: any) => ele.displayName === 'Modifiers',
        )[0].id;
        const variantCollectionId = collections.data.filter(
          (ele: any) => ele.displayName === 'Variants',
        )[0].id;
        const optionCollectionId = collections.data.filter(
          (ele: any) => ele.displayName === 'Options',
        )[0].id;

        const siteExist = await prisma.site.findUnique({
          where: {
            webflowSiteId: payload.siteId,
          },
        });
        const locationExist = await prisma.site.findUnique({
          where: {
            locationUuid: payload.locationUuid,
          },
        });
        if (siteExist || locationExist) {
          if (siteExist && locationExist) {
            const isSiteDeleted = await prisma.site.findUnique({
              where: {
                webflowSiteId: payload.siteId,
                locationUuid: payload.locationUuid,
                isDeleted: false,
              },
            });
            if (isSiteDeleted === null) {
              await prisma.site.update({
                where: { webflowSiteId: payload.siteId },
                data: {
                  isDeleted: false,
                },
              });
              return getSuccessResponse(
                'Site is Enabled Again.Use Repoll to poll the latest data',
              );
            } else {
              return getErrorResponse(
                'Site Already Exists,Please try Repolling',
              );
            }
          }
          if (siteExist) {
            return getErrorResponse(
              `Site ${siteExist.webflowSiteId} Already mapped to Location ${siteExist.locationUuid}.Please use the same Details to enable it again`,
            );
          }
          if (locationExist) {
            return getErrorResponse(
              `Location ${locationExist.locationUuid} Already mapped to Site ${locationExist.webflowSiteId} Please use the same Details to enable it again`,
            );
          }
        } else {
          const siteResult = await prisma.site.create({
            data: {
              webflowSiteId: payload.siteId,
              locationUuid: payload.locationUuid,
              locationName: payload.locationName,
              webflowLocationCollectionId: locationCollectionId,
              webflowAddressCollectionId: addressCollectionId,
              webflowMenuCollectionId: menuCollectionId,
              webflowCategoryCollectionId: categoryCollectionId,
              webflowProductCollectionId: productCollectionId,
              webflowModifierCollectionId: modifierCollectionId,
              webflowVariantCollectionId: variantCollectionId,
              webflowOptionCollectionId: optionCollectionId,
              apiKey: encryptedkey,
              userId: userId,
            },
          });
          if (siteResult) {
            console.log('siteDetails', siteResult);
            //fetching gotab location data
            const goTabLocationData = await getLocation(payload.locationUuid);
            if (!goTabLocationData.error) {
              //Adding Address details to webflow
              const addAddressToWebflow = await AddressService.create(
                payload.apiKey,
                addressCollectionId,
                goTabLocationData.data.address,
                siteResult.id,
              );
              if (!addAddressToWebflow.error) {
                console.log('address', addAddressToWebflow);
                //adding location details to webflow
                const addLocationToWebflow = await LocationService.create(
                  payload.apiKey,
                  locationCollectionId,
                  goTabLocationData.data,
                  addAddressToWebflow.data.data.id,
                  siteResult.id,
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
                    console.log(filteredOptionsArray.data.length);
                    let addOptionsToWebflow;
                    filteredOptionsArray.data.forEach(
                      async (ele: any, index: any, array: any) => {
                        addOptionsToWebflow = await OptionService.create(
                          payload.apiKey as string,
                          optionCollectionId,
                          ele,
                          siteResult.id,
                        );
                      },
                    );
                    console.log(addOptionsToWebflow);

                    // let promise1 = new Promise((resolve: any, reject: any) => {
                    //   if (filteredOptionsArray.data.length == 0) {
                    //     resolve();
                    //   }
                    //   console.log('options', filteredOptionsArray.data.length);
                    //   filteredOptionsArray.data.every(
                    //     async (ele: any, index: any, array: any) => {
                    //       setTimeout(async () => {
                    //         const addOptionsToWebflow =
                    //           await OptionService.create(
                    //             payload.apiKey as string,
                    //             optionCollectionId,
                    //             ele,
                    //             siteResult.id,
                    //           );
                    //         if (!addOptionsToWebflow.error) {
                    //           if (index === array.length - 1) {
                    //             resolve();
                    //           }
                    //         } else {
                    //           reject(addOptionsToWebflow);
                    //           return false;
                    //         }
                    //       }, index * 1000);
                    //     },
                    //   );
                    // });
                    // promise1
                    //   .then(async () => {
                    //     let promise2 = new Promise(
                    //       (resolve: any, reject: any) => {
                    //         if (filteredModifiersArray.data.length == 0) {
                    //           resolve();
                    //         }
                    //         console.log(
                    //           'modifiers',
                    //           filteredModifiersArray.data.length,
                    //         );
                    //         filteredModifiersArray.data.forEach(
                    //           async (ele: any, index: any, array: any) => {
                    //             setTimeout(async () => {
                    //               const addModifiersToWebflow =
                    //                 await ModifierService.create(
                    //                   payload.apiKey as string,
                    //                   modifierCollectionId,
                    //                   ele,
                    //                   siteResult.id,
                    //                 );
                    //               if (!addModifiersToWebflow.error) {
                    //                 if (index === array.length - 1) {
                    //                   resolve();
                    //                 }
                    //               } else {
                    //                 reject(addModifiersToWebflow);
                    //                 return false;
                    //               }
                    //             }, index * 1000);
                    //           },
                    //         );
                    //       },
                    //     );
                    //     promise2
                    //       .then(async () => {
                    //         let promise3 = new Promise(
                    //           (resolve: any, reject: any) => {
                    //             if (filteredVariantsArray.data.length == 0) {
                    //               resolve();
                    //             }
                    //             console.log(
                    //               'variants',
                    //               filteredVariantsArray.data.length,
                    //             );
                    //             filteredVariantsArray.data.forEach(
                    //               async (ele: any, index: any, array: any) => {
                    //                 setTimeout(async () => {
                    //                   const addVariantsToWebflow =
                    //                     await varientService.create(
                    //                       payload.apiKey as string,
                    //                       variantCollectionId,
                    //                       ele,
                    //                       siteResult.id,
                    //                     );
                    //                   if (!addVariantsToWebflow.error) {
                    //                     if (index === array.length - 1) {
                    //                       resolve();
                    //                     }
                    //                   } else {
                    //                     reject(addVariantsToWebflow);
                    //                     return false;
                    //                   }
                    //                 }, index * 1000);
                    //               },
                    //             );
                    //           },
                    //         );
                    //         promise3
                    //           .then(async () => {
                    //             let promise4 = new Promise(
                    //               (resolve: any, reject: any) => {
                    //                 if (
                    //                   filteredProductsArray.data.length == 0
                    //                 ) {
                    //                   resolve();
                    //                 }
                    //                 console.log(
                    //                   'products',
                    //                   filteredProductsArray.data.length,
                    //                 );
                    //                 filteredProductsArray.data.forEach(
                    //                   async (
                    //                     ele: any,
                    //                     index: any,
                    //                     array: any,
                    //                   ) => {
                    //                     setTimeout(async () => {
                    //                       const addProductsToWebflow =
                    //                         await ProductService.create(
                    //                           payload.apiKey as string,
                    //                           productCollectionId,
                    //                           ele,
                    //                           siteResult.id,
                    //                         );
                    //                       if (!addProductsToWebflow.error) {
                    //                         if (index === array.length - 1) {
                    //                           resolve();
                    //                         }
                    //                       } else {
                    //                         reject(addProductsToWebflow);
                    //                         return false;
                    //                       }
                    //                     }, index * 1000);
                    //                   },
                    //                 );
                    //               },
                    //             );
                    //             promise4
                    //               .then(() => {
                    //                 let promise5 = new Promise(
                    //                   (resolve: any, reject: any) => {
                    //                     if (
                    //                       filteredCategoriesArray.data.length ==
                    //                       0
                    //                     ) {
                    //                       resolve();
                    //                     }
                    //                     console.log(
                    //                       'categories',
                    //                       filteredCategoriesArray.data.length,
                    //                     );
                    //                     filteredCategoriesArray.data.forEach(
                    //                       async (
                    //                         ele: any,
                    //                         index: any,
                    //                         array: any,
                    //                       ) => {
                    //                         setTimeout(async () => {
                    //                           const addCategoriesToWebflow =
                    //                             await CategoryService.create(
                    //                               payload.apiKey as string,
                    //                               categoryCollectionId,
                    //                               ele,
                    //                               siteResult.id,
                    //                             );
                    //                           if (
                    //                             !addCategoriesToWebflow?.error
                    //                           ) {
                    //                             if (
                    //                               index ===
                    //                               array.length - 1
                    //                             ) {
                    //                               resolve();
                    //                             }
                    //                           } else {
                    //                             reject(addCategoriesToWebflow);
                    //                             return false;
                    //                           }
                    //                         }, index * 1000);
                    //                       },
                    //                     );
                    //                   },
                    //                 );
                    //                 promise5
                    //                   .then(() => {
                    //                     let promise6 = new Promise(
                    //                       (resolve: any, reject: any) => {
                    //                         if (
                    //                           filteredMenusArray.data.length ==
                    //                           0
                    //                         ) {
                    //                           resolve();
                    //                         }
                    //                         console.log(
                    //                           'menus',
                    //                           filteredMenusArray.data.length,
                    //                         );
                    //                         filteredMenusArray.data.forEach(
                    //                           async (
                    //                             ele: any,
                    //                             index: any,
                    //                             array: any,
                    //                           ) => {
                    //                             setTimeout(async () => {
                    //                               const addMenusToWebflow =
                    //                                 await MenuService.create(
                    //                                   payload.apiKey as string,
                    //                                   menuCollectionId,
                    //                                   ele,
                    //                                   siteResult.id,
                    //                                 );
                    //                               if (
                    //                                 !addMenusToWebflow?.error
                    //                               ) {
                    //                                 if (
                    //                                   index ===
                    //                                   array.length - 1
                    //                                 ) {
                    //                                   resolve();
                    //                                 }
                    //                               } else {
                    //                                 reject(addMenusToWebflow);
                    //                                 return false;
                    //                               }
                    //                             }, index * 1000);
                    //                           },
                    //                         );
                    //                       },
                    //                     );
                    //                     promise6
                    //                       .then((data) => {
                    //                         return data;
                    //                       })
                    //                       .catch(async (error) => {
                    //                         console.log('menus-catch', error);
                    //                         const errorMsg = `${error?.errors?.response.data.message} while adding Menu`;
                    //                         await ErrorLog.logErrorToDb(
                    //                           error?.errors?.response.data.code,
                    //                           errorMsg,
                    //                           siteResult.id,
                    //                           payload,
                    //                           error?.errors?.response.config,
                    //                         );
                    //                         return getErrorResponse(
                    //                           errorMsg,
                    //                           error?.errors?.response,
                    //                         );
                    //                       });
                    //                   })
                    //                   .catch(async (error) => {
                    //                     console.log('category-catch', error);
                    //                     const errorMsg = `${error?.errors?.response.data.message} while adding categories`;
                    //                     await ErrorLog.logErrorToDb(
                    //                       error?.errors?.response.data.code,
                    //                       errorMsg,
                    //                       siteResult.id,
                    //                       payload,
                    //                       error?.errors?.response.config,
                    //                     );
                    //                     return getErrorResponse(
                    //                       errorMsg,
                    //                       error?.errors?.response,
                    //                     );
                    //                   });
                    //               })
                    //               .catch(async (error) => {
                    //                 console.log('products-catch', error);
                    //                 const errorMsg = `${error?.errors?.response.data.message} while adding products`;
                    //                 await ErrorLog.logErrorToDb(
                    //                   error?.errors?.response.data.code,
                    //                   errorMsg,
                    //                   siteResult.id,
                    //                   payload,
                    //                   error?.errors?.response.config,
                    //                 );
                    //                 return getErrorResponse(
                    //                   errorMsg,
                    //                   error?.errors?.response,
                    //                 );
                    //               });
                    //           })
                    //           .catch(async (error) => {
                    //             console.log('variants-catch', error);
                    //             const errorMsg = `${error?.errors?.response.data.message} while adding variants`;
                    //             await ErrorLog.logErrorToDb(
                    //               error?.errors?.response.data.code,
                    //               errorMsg,
                    //               siteResult.id,
                    //               payload,
                    //               error?.errors?.response.config,
                    //             );
                    //             return getErrorResponse(
                    //               errorMsg,
                    //               error?.errors?.response,
                    //             );
                    //           });
                    //       })
                    //       .catch(async (error) => {
                    //         console.log('modifiers-catch', error);
                    //         const errorMsg = `${error?.errors?.response.data.message} while adding modifiers`;
                    //         await ErrorLog.logErrorToDb(
                    //           error?.errors?.response.data.code,
                    //           errorMsg,
                    //           siteResult.id,
                    //           payload,
                    //           error?.errors?.response.config,
                    //         );
                    //         return getErrorResponse(
                    //           errorMsg,
                    //           error?.errors?.response,
                    //         );
                    //       });
                    //   })
                    //   .catch(async (error) => {
                    //     console.log('options-catch', error);
                    //     const errorMsg = ` while adding options, ${error?.errors?.response.data.message}`;
                    //     await ErrorLog.logErrorToDb(
                    //       error?.errors?.response.data.code,
                    //       errorMsg,
                    //       siteResult.id,
                    //       payload,
                    //       error?.errors?.config,
                    //     );
                    //     return getErrorResponse(
                    //       errorMsg,
                    //       error?.errors?.response,
                    //     );
                    //   });
                  } else {
                    console.log('schemamismatch-catch');
                    await ErrorLog.logErrorToDb(
                      'Schema Mismatch/property not found',
                      'Schema Mismatch/property not found',
                      siteResult.id,
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
                    siteResult.id,
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
                  siteResult.id,
                  payload,
                  addAddressToWebflow.errors.config,
                );
                return getErrorResponse(errMsg, addAddressToWebflow);
              }
            }
            return getSuccessResponse(
              'Site Added,Importing Process Started,we will inform through email once the process is completed',
              siteResult,
            );
          }
        }
      } else {
        console.log('afetch-collections-error', collections);
        const errMsg = `Error fetching Collections from webflow, ${collections.errors.response.data.message}`;
        await ErrorLog.logErrorToDb(
          collections.errors.response.data.code,
          errMsg,
          parseInt(payload.siteId, 10),
          payload,
        );
        return getErrorResponse(errMsg, collections);
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse();
    }
  };
  public static deleteSite = async (id: number, userId: number) => {
    try {
      const user = await UserService.getUserById(userId);

      if (!user) {
        return getErrorResponse('Invalid userId');
      }
      await prisma.site.update({
        where: { id },
        data: {
          isDeleted: true,
        },
      });

      return getSuccessResponse('site Deleted successfully');
    } catch (error) {
      logger.log(error, 'error');
      return getErrorResponse();
    }
  };

  public static repollData = async (id: number, userId: number) => {
    try {
      // testing whether the logged in user existed
      const user = await UserService.getUserById(userId);
      if (!user) {
        return getErrorResponse('Invalid userId');
      }
      // //fetching site details from middleware
      const siteDetails = await prisma.site.findUnique({
        where: { id, isDeleted: false },
        include: { Location: true },
      });
      if (siteDetails) {
        //fetching gotab location data
        const goTabLocationData = await getLocation(
          siteDetails?.Location[0]?.locationUuid as string,
        );
        if (!goTabLocationData.error) {
          //updating Address details to webflow
          const updateWebflowAddress = await AddressService.sync(
            siteDetails?.apiKey as string,
            siteDetails?.webflowAddressCollectionId as string,
            goTabLocationData.data.address,
            siteDetails?.id,
          );
          if (!updateWebflowAddress.error) {
            //updating location details to webflow
            const updatewebflowLocation = await LocationService.sync(
              siteDetails?.apiKey as string,
              siteDetails?.webflowLocationCollectionId as string,
              goTabLocationData.data,
              updateWebflowAddress.data.data.id,
              siteDetails?.id,
            );
            if (!updatewebflowLocation.error) {
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
                //filtering options that are present in middleware/cms but are not coming from the api response
                const middlewareOptions = await prisma.option.findMany();
                const unAvailableOptions = middlewareOptions.filter(
                  (ele: any) =>
                    !filteredOptionsArray.data.find(
                      (ele2: any) => ele?.gotabOptionuid === ele2?.uid,
                    ),
                );
                let promise1 = new Promise((resolve: any, reject: any) => {
                  if (unAvailableOptions.length === 0) {
                    resolve();
                  }
                  unAvailableOptions.every(
                    async (ele: any, index: any, array: any) => {
                      setTimeout(async () => {
                        const deleteUnavailableOptions =
                          await OptionService.delete(
                            siteDetails.apiKey as string,
                            siteDetails?.webflowOptionCollectionId,
                            ele,
                            siteDetails.id,
                          );
                        if (!deleteUnavailableOptions?.error) {
                          if (index === array.length - 1) {
                            resolve();
                          }
                        } else {
                          reject(deleteUnavailableOptions);
                          return false;
                        }
                      }, index * 1000);
                    },
                  );
                });
                promise1
                  .then(async () => {
                    //updating options to webflow
                    let promise2 = new Promise((resolve: any, reject: any) => {
                      if (filteredOptionsArray.data.length === 0) {
                        resolve();
                      }
                      filteredOptionsArray.data.every(
                        async (ele: any, index: any, array: any) => {
                          setTimeout(async () => {
                            const updateWebflowOptions =
                              await OptionService.sync(
                                siteDetails?.apiKey as string,
                                siteDetails?.webflowOptionCollectionId,
                                ele,
                                siteDetails.id,
                              );
                            if (!updateWebflowOptions?.error) {
                              if (index === array.length - 1) {
                                resolve();
                              }
                            } else {
                              reject(updateWebflowOptions);
                              return false;
                            }
                          }, index * 1000);
                        },
                      );
                    });
                    //deleting the unavailable Modifiers if present any
                    promise2
                      .then(async () => {
                        const middlewareModifiers =
                          await prisma.modifier.findMany();
                        const unAvailableModifiers = middlewareModifiers.filter(
                          (ele: any) =>
                            !filteredModifiersArray.data.find(
                              (ele2: any) =>
                                ele?.gotabModifieruid === ele2?.uid,
                            ),
                        );
                        let promise3 = new Promise(
                          (resolve: any, reject: any) => {
                            if (unAvailableModifiers.length === 0) {
                              resolve();
                            }
                            unAvailableModifiers.every(
                              async (ele: any, index: any, array: any) => {
                                setTimeout(async () => {
                                  const deleteUnavailableModifiers =
                                    await ModifierService.delete(
                                      siteDetails.apiKey as string,
                                      siteDetails?.webflowModifierCollectionId,
                                      ele,
                                      siteDetails.id,
                                    );
                                  if (!deleteUnavailableModifiers?.error) {
                                    if (index === array.length - 1) {
                                      resolve();
                                    }
                                  } else {
                                    reject(deleteUnavailableModifiers);
                                    return false;
                                  }
                                }, index * 1000);
                              },
                            );
                          },
                        );
                        promise3
                          .then(async () => {
                            //Updating modifiers
                            let promise4 = new Promise(
                              (resolve: any, reject: any) => {
                                if (filteredModifiersArray.data.length === 0) {
                                  resolve();
                                }
                                filteredModifiersArray.data.every(
                                  async (ele: any, index: any, array: any) => {
                                    setTimeout(async () => {
                                      const updateWebflowModifiers =
                                        await ModifierService.sync(
                                          siteDetails?.apiKey as string,
                                          siteDetails?.webflowModifierCollectionId,
                                          ele,
                                          siteDetails.id,
                                        );
                                      if (!updateWebflowModifiers?.error) {
                                        if (index === array.length - 1) {
                                          resolve();
                                        }
                                      } else {
                                        reject(updateWebflowModifiers);
                                        return false;
                                      }
                                    }, index * 1000);
                                  },
                                );
                              },
                            );
                            // deleting the unavailable variants if present any
                            promise4
                              .then(async () => {
                                const middlewareVariants =
                                  await prisma.variant.findMany();
                                const unAvailableVariants =
                                  middlewareVariants.filter(
                                    (ele: any) =>
                                      !filteredVariantsArray.data.find(
                                        (ele2: any) =>
                                          ele?.gotabVariantsku === ele2?.sku,
                                      ),
                                  );
                                let promise5 = new Promise(
                                  (resolve: any, reject: any) => {
                                    if (unAvailableVariants.length === 0) {
                                      resolve();
                                    }
                                    unAvailableVariants.every(
                                      async (
                                        ele: any,
                                        index: any,
                                        array: any,
                                      ) => {
                                        setTimeout(async () => {
                                          const deleteUnavailableVarients =
                                            await VarientService.delete(
                                              siteDetails.apiKey as string,
                                              siteDetails?.webflowVariantCollectionId,
                                              ele,
                                              siteDetails.id,
                                            );
                                          if (
                                            !deleteUnavailableVarients?.error
                                          ) {
                                            if (index === array.length - 1) {
                                              resolve();
                                            }
                                          } else {
                                            reject(deleteUnavailableVarients);
                                            return false;
                                          }
                                        }, index * 1000);
                                      },
                                    );
                                  },
                                );
                                promise5
                                  .then(async () => {
                                    //Updating Varients
                                    let promise6 = new Promise(
                                      (resolve: any, reject: any) => {
                                        if (
                                          filteredVariantsArray.data.length ===
                                          0
                                        ) {
                                          resolve();
                                        }
                                        filteredVariantsArray.data.every(
                                          async (
                                            ele: any,
                                            index: any,
                                            array: any,
                                          ) => {
                                            setTimeout(async () => {
                                              const updateWebflowVariants =
                                                await VarientService.sync(
                                                  siteDetails?.apiKey as string,
                                                  siteDetails?.webflowVariantCollectionId,
                                                  ele,
                                                  siteDetails.id,
                                                );
                                              if (
                                                !updateWebflowVariants?.error
                                              ) {
                                                if (
                                                  index ===
                                                  array.length - 1
                                                ) {
                                                  resolve();
                                                }
                                              } else {
                                                reject(updateWebflowVariants);
                                                return false;
                                              }
                                            }, index * 1000);
                                          },
                                        );
                                      },
                                    );
                                    promise6
                                      .then(async () => {
                                        const middlewareProducts =
                                          await prisma.product.findMany();
                                        const unAvailableProducts =
                                          middlewareProducts.filter(
                                            (ele: any) =>
                                              !filteredProductsArray.data.find(
                                                (ele2: any) =>
                                                  ele?.productUuid ===
                                                  ele2?.productUuid,
                                              ),
                                          );
                                        let promise7 = new Promise(
                                          (resolve: any, reject: any) => {
                                            if (
                                              unAvailableProducts.length === 0
                                            ) {
                                              resolve();
                                            }
                                            unAvailableProducts.every(
                                              async (
                                                ele: any,
                                                index: any,
                                                array: any,
                                              ) => {
                                                setTimeout(async () => {
                                                  const deleteUnavailableProducts =
                                                    await ProductService.delete(
                                                      siteDetails.apiKey as string,
                                                      siteDetails?.webflowProductCollectionId as string,
                                                      ele,
                                                      siteDetails.id,
                                                    );
                                                  if (
                                                    !deleteUnavailableProducts?.error
                                                  ) {
                                                    if (
                                                      index ===
                                                      array.length - 1
                                                    ) {
                                                      resolve();
                                                    }
                                                  } else {
                                                    reject(
                                                      deleteUnavailableProducts,
                                                    );
                                                    return false;
                                                  }
                                                }, index * 1000);
                                              },
                                            );
                                          },
                                        );
                                        promise7
                                          .then(async () => {
                                            //updating products
                                            let promise8 = new Promise(
                                              (resolve: any, reject: any) => {
                                                if (
                                                  filteredProductsArray.data
                                                    .length === 0
                                                ) {
                                                  resolve();
                                                }
                                                filteredProductsArray.data.every(
                                                  async (
                                                    ele: any,
                                                    index: any,
                                                    array: any,
                                                  ) => {
                                                    setTimeout(async () => {
                                                      const updateWebflowProducts =
                                                        await ProductService.sync(
                                                          siteDetails?.apiKey as string,
                                                          siteDetails?.webflowProductCollectionId,
                                                          ele,
                                                          siteDetails.id,
                                                        );
                                                      if (
                                                        !updateWebflowProducts?.error
                                                      ) {
                                                        if (
                                                          index ===
                                                          array.length - 1
                                                        ) {
                                                          resolve();
                                                        }
                                                      } else {
                                                        reject(
                                                          updateWebflowProducts,
                                                        );
                                                        return false;
                                                      }
                                                    }, index * 1000);
                                                  },
                                                );
                                              },
                                            );
                                            promise8
                                              .then(async () => {
                                                //deleting unavailable categories
                                                const middlewareCategories =
                                                  await prisma.category.findMany();
                                                const unAvailableCategories =
                                                  middlewareCategories.filter(
                                                    (ele: any) =>
                                                      !filteredCategoriesArray.data.find(
                                                        (ele2: any) =>
                                                          ele?.gotabCategoryId ===
                                                          ele2?.categoryId,
                                                      ),
                                                  );
                                                let promise9 = new Promise(
                                                  (
                                                    resolve: any,
                                                    reject: any,
                                                  ) => {
                                                    if (
                                                      unAvailableCategories.length ===
                                                      0
                                                    ) {
                                                      resolve();
                                                    }
                                                    unAvailableCategories.every(
                                                      async (
                                                        ele: any,
                                                        index: any,
                                                        array: any,
                                                      ) => {
                                                        setTimeout(async () => {
                                                          const deleteUnavailableCategories =
                                                            await CategoryService.delete(
                                                              siteDetails.apiKey as string,
                                                              siteDetails?.webflowCategoryCollectionId,
                                                              ele,
                                                              siteDetails.id,
                                                            );
                                                          if (
                                                            !deleteUnavailableCategories?.error
                                                          ) {
                                                            if (
                                                              index ===
                                                              array.length - 1
                                                            ) {
                                                              resolve();
                                                            }
                                                          } else {
                                                            reject(
                                                              deleteUnavailableCategories,
                                                            );
                                                            return false;
                                                          }
                                                        }, index * 1000);
                                                      },
                                                    );
                                                  },
                                                );
                                                promise9
                                                  .then(async () => {
                                                    //updating categories
                                                    let promise10 = new Promise(
                                                      (
                                                        resolve: any,
                                                        reject: any,
                                                      ) => {
                                                        if (
                                                          filteredCategoriesArray
                                                            .data.length === 0
                                                        ) {
                                                          resolve();
                                                        }
                                                        filteredCategoriesArray.data.every(
                                                          async (
                                                            ele: any,
                                                            index: any,
                                                            array: any,
                                                          ) => {
                                                            setTimeout(
                                                              async () => {
                                                                const updateWebflowCategories =
                                                                  await CategoryService.sync(
                                                                    siteDetails?.apiKey as string,
                                                                    siteDetails?.webflowCategoryCollectionId,
                                                                    ele,
                                                                    siteDetails.id,
                                                                  );
                                                                if (
                                                                  !updateWebflowCategories?.error
                                                                ) {
                                                                  if (
                                                                    index ===
                                                                    array.length -
                                                                      1
                                                                  ) {
                                                                    resolve();
                                                                  }
                                                                } else {
                                                                  reject(
                                                                    updateWebflowCategories,
                                                                  );
                                                                  return false;
                                                                }
                                                              },
                                                              index * 1000,
                                                            );
                                                          },
                                                        );
                                                      },
                                                    );
                                                    promise10
                                                      .then(async () => {
                                                        const middlewareMenus =
                                                          await prisma.menu.findMany();
                                                        const unAvailableMenus =
                                                          middlewareMenus.filter(
                                                            (ele: any) =>
                                                              !filteredMenusArray.data.find(
                                                                (ele2: any) =>
                                                                  ele?.gotabMenuId ===
                                                                  ele2?.menuId,
                                                              ),
                                                          );
                                                        let promise11 =
                                                          new Promise(
                                                            (
                                                              resolve: any,
                                                              reject: any,
                                                            ) => {
                                                              if (
                                                                unAvailableMenus.length ===
                                                                0
                                                              ) {
                                                                resolve();
                                                              }
                                                              unAvailableMenus.every(
                                                                async (
                                                                  ele: any,
                                                                  index: any,
                                                                  array: any,
                                                                ) => {
                                                                  setTimeout(
                                                                    async () => {
                                                                      const deleteUnavailableMenu =
                                                                        await MenuService.delete(
                                                                          siteDetails.apiKey as string,
                                                                          siteDetails?.webflowMenuCollectionId,
                                                                          ele,
                                                                          siteDetails.id,
                                                                        );
                                                                      if (
                                                                        !deleteUnavailableMenu?.error
                                                                      ) {
                                                                        if (
                                                                          index ===
                                                                          array.length -
                                                                            1
                                                                        ) {
                                                                          resolve();
                                                                        }
                                                                      } else {
                                                                        reject(
                                                                          deleteUnavailableMenu,
                                                                        );
                                                                        return false;
                                                                      }
                                                                    },
                                                                    index *
                                                                      1000,
                                                                  );
                                                                },
                                                              );
                                                            },
                                                          );
                                                        promise11
                                                          .then(async () => {
                                                            //updating menu items
                                                            let promise12 =
                                                              new Promise(
                                                                (
                                                                  resolve: any,
                                                                  reject: any,
                                                                ) => {
                                                                  if (
                                                                    filteredMenusArray
                                                                      .data
                                                                      .length ==
                                                                    0
                                                                  ) {
                                                                    resolve();
                                                                  }
                                                                  filteredMenusArray.data.every(
                                                                    async (
                                                                      ele: any,
                                                                      index: any,
                                                                      array: any,
                                                                    ) => {
                                                                      setTimeout(
                                                                        async () => {
                                                                          const updateWebflowMenu =
                                                                            await MenuService.sync(
                                                                              siteDetails?.apiKey as string,
                                                                              siteDetails?.webflowMenuCollectionId,
                                                                              ele,
                                                                              siteDetails.id,
                                                                            );
                                                                          if (
                                                                            !updateWebflowMenu?.error
                                                                          ) {
                                                                            if (
                                                                              index ===
                                                                              array.length -
                                                                                1
                                                                            ) {
                                                                              resolve();
                                                                            }
                                                                          } else {
                                                                            reject(
                                                                              updateWebflowMenu,
                                                                            );
                                                                            return false;
                                                                          }
                                                                        },
                                                                        index *
                                                                          1000,
                                                                      );
                                                                    },
                                                                  );
                                                                },
                                                              );
                                                            promise12
                                                              .then(
                                                                async () => {
                                                                  await prisma.site.update(
                                                                    {
                                                                      where: {
                                                                        id: siteDetails?.id,
                                                                      },
                                                                      data: {
                                                                        isWebhookFailed:
                                                                          false,
                                                                      },
                                                                    },
                                                                  );
                                                                },
                                                              )
                                                              .catch(
                                                                async (
                                                                  error: any,
                                                                ) => {
                                                                  const errorMsg = `${error?.errors?.response.data.message} while Repolling Menus`;
                                                                  await ErrorLog.logErrorToDb(
                                                                    error
                                                                      ?.errors
                                                                      ?.response
                                                                      .data
                                                                      .code,
                                                                    errorMsg,
                                                                    siteDetails.id,
                                                                    siteDetails,
                                                                    error
                                                                      ?.errors
                                                                      ?.response
                                                                      .config,
                                                                  );
                                                                  return getErrorResponse(
                                                                    errorMsg,
                                                                    error,
                                                                  );
                                                                },
                                                              );
                                                          })
                                                          .catch(
                                                            async (
                                                              error: any,
                                                            ) => {
                                                              const errorMsg = `${error?.errors?.response.data.message} while Deleting Unavailable Menus`;
                                                              await ErrorLog.logErrorToDb(
                                                                error?.errors
                                                                  ?.response
                                                                  .data.code,
                                                                errorMsg,
                                                                siteDetails.id,
                                                                siteDetails,
                                                                error?.errors
                                                                  ?.response
                                                                  .config,
                                                              );
                                                              return getErrorResponse(
                                                                errorMsg,
                                                                error,
                                                              );
                                                            },
                                                          );
                                                      })
                                                      .catch(
                                                        async (error: any) => {
                                                          const errorMsg = `${error?.errors?.response.data.message} while Repolling Categories`;
                                                          await ErrorLog.logErrorToDb(
                                                            error?.errors
                                                              ?.response.data
                                                              .code,
                                                            errorMsg,
                                                            siteDetails.id,
                                                            siteDetails,
                                                            error?.errors
                                                              ?.response.config,
                                                          );
                                                          return getErrorResponse(
                                                            errorMsg,
                                                            error,
                                                          );
                                                        },
                                                      );
                                                  })
                                                  .catch(async (error: any) => {
                                                    const errorMsg = `${error?.errors?.response.data.message}  while Deleting Unavailable Categories`;
                                                    await ErrorLog.logErrorToDb(
                                                      error?.errors?.response
                                                        .data.code,
                                                      errorMsg,
                                                      siteDetails.id,
                                                      siteDetails,
                                                      error?.errors?.response
                                                        .config,
                                                    );
                                                    return getErrorResponse(
                                                      errorMsg,
                                                      error,
                                                    );
                                                  });
                                              })
                                              .catch(async (error: any) => {
                                                const errorMsg = `${error?.errors?.response.data.message} while Repolling Products`;
                                                await ErrorLog.logErrorToDb(
                                                  error?.errors?.response.data
                                                    .code,
                                                  errorMsg,
                                                  siteDetails.id,
                                                  siteDetails,
                                                  error?.errors?.response
                                                    .config,
                                                );
                                                return getErrorResponse(
                                                  'Error Repolling Products ',
                                                  error,
                                                );
                                              });
                                          })
                                          .catch(async (error: any) => {
                                            const errorMsg = `${error?.errors?.response.data.message} while Deleting Unavailable Products`;
                                            await ErrorLog.logErrorToDb(
                                              error?.errors?.response.data.code,
                                              errorMsg,
                                              siteDetails.id,
                                              siteDetails,
                                              error?.errors?.response.config,
                                            );
                                            return getErrorResponse(
                                              errorMsg,
                                              error,
                                            );
                                          });
                                      })
                                      .catch(async (error: any) => {
                                        const errorMsg = `${error?.errors?.response.data.message} while Repolling Modifiers`;
                                        await ErrorLog.logErrorToDb(
                                          error?.errors?.response.data.code,
                                          errorMsg,
                                          siteDetails.id,
                                          siteDetails,
                                          error?.errors?.response.config,
                                        );
                                        return getErrorResponse(
                                          errorMsg,
                                          error,
                                        );
                                      });
                                  })
                                  .catch(async (error: any) => {
                                    const errorMsg = `${error?.errors?.response.data.message} while Deleting Modifiers`;
                                    await ErrorLog.logErrorToDb(
                                      error?.errors?.response.data.code,
                                      errorMsg,
                                      siteDetails.id,
                                      siteDetails,
                                      error?.errors?.response.config,
                                    );
                                    return getErrorResponse(errorMsg, error);
                                  });
                              })
                              .catch(async (error: any) => {
                                const errorMsg = `${error?.errors?.response.data.message} while Repolling Variants`;
                                await ErrorLog.logErrorToDb(
                                  error?.errors?.response.data.code,
                                  errorMsg,
                                  siteDetails.id,
                                  siteDetails,
                                  error?.errors?.response.config,
                                );
                                return getErrorResponse(errorMsg, error);
                              });
                          })
                          .catch(async (error: any) => {
                            const errorMsg = `${error?.errors?.response.data.message} while Deleting Variants`;
                            await ErrorLog.logErrorToDb(
                              error?.errors?.response.data.code,
                              errorMsg,
                              siteDetails.id,
                              siteDetails,
                              error?.errors?.response.config,
                            );
                            return getErrorResponse(errorMsg, error);
                          });
                      })
                      .catch(async (error: any) => {
                        const errorMsg = `${error?.errors?.response.data.message} while Repolling Options`;
                        await ErrorLog.logErrorToDb(
                          error?.errors?.response.data.code,
                          errorMsg,
                          siteDetails.id,
                          siteDetails,
                          error?.errors?.response.config,
                        );
                        return getErrorResponse(errorMsg, error);
                      });
                  })
                  .catch(async (error: any) => {
                    const errorMsg = `${error?.errors?.response.data.message} while Deleting Options`;
                    await ErrorLog.logErrorToDb(
                      error?.errors?.response.data.code,
                      errorMsg,
                      siteDetails.id,
                      siteDetails,
                      error?.errors?.response.config,
                    );
                    return getErrorResponse(errorMsg, error);
                  });
              } else {
                await ErrorLog.logErrorToDb(
                  'Schema Mismatch/property not found',
                  'Schema Mismatch/property not found',
                  siteDetails.id,
                  siteDetails,
                );
                return getErrorResponse(
                  'Error may be occured due to server error or schema mismatch or property not found',
                );
              }
              return getSuccessResponse(
                'Data Repolling Process Started,we will inform through email once the process is completed',
              );
            } else {
              const errMsg = `Error while repolling location, ${updatewebflowLocation.errors.response.data.message}`;
              await ErrorLog.logErrorToDb(
                updatewebflowLocation.errors.response.data.code,
                errMsg,
                siteDetails.id,
                siteDetails,
                updatewebflowLocation.errors.config,
              );
              return getErrorResponse(errMsg, updatewebflowLocation);
            }
          } else {
            const errorMsg = `Error while repolling address, ${updateWebflowAddress.errors.response.data.message}`;
            await ErrorLog.logErrorToDb(
              updateWebflowAddress.errors.response.data.code,
              errorMsg,
              siteDetails.id,
              siteDetails,
              updateWebflowAddress.errors.config,
            );
            return getErrorResponse(errorMsg, updateWebflowAddress);
          }
        }
      } else {
        return getErrorResponse('Error Repolling since the site is deleted');
      }
    } catch (error) {
      logger.log(error, 'error');
      return getErrorResponse();
    }
  };
}
