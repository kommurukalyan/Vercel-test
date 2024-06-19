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
  try {
    const goTabLocationData = await getLocation(payload.locationUuid);
    if (goTabLocationData.error) {
      throw new Error('Error fetching location data');
    }

    const addAddressToWebflow = await AddressService.create(
      payload.apiKey,
      collections.addressCollectionId,
      goTabLocationData.data.address,
      siteId,
    );

    if (addAddressToWebflow.error) {
      throw new Error('Error inserting address');
    }

    const addLocationToWebflow = await LocationService.create(
      payload.apiKey,
      collections.locationCollectionId,
      goTabLocationData.data,
      addAddressToWebflow.data.data.id,
      siteId,
    );

    if (addLocationToWebflow.error) {
      throw new Error('Error inserting location');
    }

    const [
      filteredOptionsArray,
      filteredVariantsArray,
      filteredModifiersArray,
      filteredProductsArray,
      filteredCategoriesArray,
      filteredMenusArray,
    ] = await Promise.all([
      getOptions(goTabLocationData.data.locationId),
      getVariants(goTabLocationData.data.locationId),
      getModifiers(goTabLocationData.data.locationId),
      getProducts(goTabLocationData.data.locationId),
      getCategories(goTabLocationData.data.locationId),
      getMenus(goTabLocationData.data.locationId),
    ]);

    if (
      filteredProductsArray.error ||
      filteredCategoriesArray.error ||
      filteredMenusArray.error ||
      filteredModifiersArray.error ||
      filteredOptionsArray.error
    ) {
      throw new Error('Error fetching data from GoTab');
    }

    const addDataToWebflow = async (
      dataArray: any,
      service: any,
      collectionId: any,
    ) => {
      const promises = dataArray.map(
        (ele: any, index: any) =>
          new Promise((resolve, reject) => {
            setTimeout(async () => {
              try {
                const result = await service.create(
                  payload.apiKey,
                  collectionId,
                  ele,
                  siteId,
                );
                if (!result.error) {
                  resolve(result);
                } else {
                  reject(result);
                }
              } catch (error) {
                reject(error);
              }
            }, index * 1000);
          }),
      );

      return Promise.all(promises);
    };

    await addDataToWebflow(
      filteredOptionsArray.data,
      OptionService,
      collections.optionCollectionId,
    );
    await addDataToWebflow(
      filteredModifiersArray.data,
      ModifierService,
      collections.modifierCollectionId,
    );
    await addDataToWebflow(
      filteredVariantsArray.data,
      varientService,
      collections.variantCollectionId,
    );
    await addDataToWebflow(
      filteredProductsArray.data,
      ProductService,
      collections.productCollectionId,
    );
    await addDataToWebflow(
      filteredCategoriesArray.data,
      CategoryService,
      collections.categoryCollectionId,
    );
    await addDataToWebflow(
      filteredMenusArray.data,
      MenuService,
      collections.menuCollectionId,
    );

    await AwsEmailClient.sendMailUsingMailer({
      to: 'dev@ionixsystems.com',
      subject: 'Import Success',
      html: `<div><h3>Success</h3><p>Data Imported Successfully</p></div>`,
    });

    return getSuccessResponse('Data imported successfully');
  } catch (error) {
    console.error('importData-error', error);
    await ErrorLog.logErrorToDb(
      error.code || '500',
      error.message || 'Unknown error',
      siteId,
      payload,
    );
    return getErrorResponse(error.message || 'Error during import');
  }
};
