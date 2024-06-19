import AddSiteRequest from '@/server/request/addSiteRequest';
import config from '@/server/serverUtils/config';
import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import logger from '@/server/serverUtils/logger';
import UserService from '@/server/services/userService';
import prisma from '@/lib/prisma';
import AwsEmailClient from '@/server/serverUtils/AwsClient/emailClient';

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
import { importData } from './importData';

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
            const collections = {
              locationCollectionId: locationCollectionId,
              addressCollectionId: addressCollectionId,
              menuCollectionId: menuCollectionId,
              categoryCollectionId: categoryCollectionId,
              productCollectionId: productCollectionId,
              modifierCollectionId: modifierCollectionId,
              optionCollectionId: optionCollectionId,
              variantCollectionId: variantCollectionId,
            };
            //fetching gotab location data
           await importData(payload, siteResult.id, collections);
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
          siteDetails?.locationUuid as string,
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
            console.log(updateWebflowAddress.data);
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
                  console.log('deletedOptions', unAvailableOptions.length);
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
                      console.log(
                        'RepollingOptions',
                        filteredOptionsArray.data.length,
                      );
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
                            console.log(
                              'deletedModifiers',
                              unAvailableModifiers.length,
                            );
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
                                console.log(
                                  'RepollingModifiers',
                                  filteredModifiersArray.data.length,
                                );
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
                                    console.log(
                                      'DeletedVaraiants',
                                      unAvailableVariants.length,
                                    );
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
                                        console.log(
                                          'RepolledVaraiants',
                                          filteredVariantsArray.data.length,
                                        );
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
                                            console.log(
                                              'DeletedProducts',
                                              unAvailableProducts.length,
                                            );
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
                                                console.log(
                                                  'RepolledProducts',
                                                  filteredProductsArray.data
                                                    .length,
                                                );
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
                                                          siteDetails?.locationUuid,
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
                                                    console.log(
                                                      'DeletedCategories',
                                                      unAvailableCategories.length,
                                                    );
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
                                                        console.log(
                                                          'RepolledCategories',
                                                          filteredCategoriesArray
                                                            .data.length,
                                                        );
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
                                                                    siteDetails?.locationUuid,
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
                                                              console.log(
                                                                'DeletedMenus',
                                                                unAvailableMenus.length,
                                                              );
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
                                                                  console.log(
                                                                    'RepollingMenus',
                                                                    filteredMenusArray
                                                                      .data
                                                                      .length,
                                                                  );
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
                                                                              siteDetails?.locationUuid,
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
                                                                  console.log(
                                                                    'Repolling success',
                                                                  );
                                                                  await AwsEmailClient.sendMailUsingMailer(
                                                                    {
                                                                      to: 'dev@ionixsystems.com',
                                                                      subject:
                                                                        'Repolling Success',
                                                                      html: `
                                                                  <div>
                                                                  <h3>Success</h3>
                                                                  <p>Data Repolled Successfully</p>
                                                                   </div>
                                                                  `,
                                                                    },
                                                                  );
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
                                                                  console.log(
                                                                    'Repollmenuscatch',
                                                                    error,
                                                                  );
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
                                                              console.log(
                                                                'DeleteUnavailablemenuscatch',
                                                                error,
                                                              );
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
                                                          console.log(
                                                            'Repollcategoriescatch',
                                                            error,
                                                          );
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
                                                    console.log(
                                                      'DeleteUnavailableCategoriescatch',
                                                      error,
                                                    );
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
                                                console.log(
                                                  'Repollproductscatch',
                                                  error,
                                                );
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
                                            console.log(
                                              'Deleteunavailableproductscatch',
                                              error,
                                            );
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
                                        console.log(
                                          'Repollmodifierscatch',
                                          error,
                                        );
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
                                    console.log(
                                      'Deleteunavailablemodifierscatch',
                                      error,
                                    );
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
                                console.log('Repollvariantscatch', error);
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
                            console.log(
                              'Deleteunavailablevariantscatch',
                              error,
                            );
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
                        console.log('Repolloptionscatch', error);
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
                    console.log('Deleteunavailableoptionscatch', error);
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
                console.log(
                  'Error may be occured due to server error or schema mismatch or property not found',
                );
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
              console.log(
                'Repollinglocationerror',
                updatewebflowLocation.errors,
              );
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
            console.log('RepollingAddresserror', updateWebflowAddress.errors);
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
