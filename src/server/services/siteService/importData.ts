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
      const errorMsg = `Error fetching location data: ${goTabLocationData.error}`;
      await logError(errorMsg, siteId, payload);
      return getErrorResponse(errorMsg);
    }

    // Adding Address details to webflow
    const addAddressToWebflow = await AddressService.create(
      payload.apiKey,
      collections.addressCollectionId,
      goTabLocationData.data.address,
      siteId,
    );
    if (addAddressToWebflow.error) {
      const errorMsg = `Error adding address to Webflow: ${addAddressToWebflow.error}`;
      await logError(errorMsg, siteId, payload);
      return getErrorResponse(errorMsg);
    }

    // Adding Location details to webflow
    const addLocationToWebflow = await LocationService.create(
      payload.apiKey,
      collections.locationCollectionId,
      goTabLocationData.data,
      addAddressToWebflow.data.data.id,
      siteId,
    );
    if (addLocationToWebflow.error) {
      const errorMsg = `Error adding location to Webflow: ${addLocationToWebflow.error}`;
      await logError(errorMsg, siteId, payload);
      return getErrorResponse(errorMsg);
    }

    // Fetching GoTab data
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
      filteredOptionsArray.error ||
      filteredVariantsArray.error ||
      filteredModifiersArray.error ||
      filteredProductsArray.error ||
      filteredCategoriesArray.error ||
      filteredMenusArray.error
    ) {
      const errorMsg = 'Error fetching GoTab data';
      await logError(errorMsg, siteId, payload);
      return getErrorResponse(errorMsg);
    }

    // Create promises for each data type
    const promises = [];

    // Options
    if (filteredOptionsArray.data.length > 0) {
      promises.push(
        Promise.all(
          filteredOptionsArray.data.map(async (option: any) => {
            const result = await OptionService.create(
              payload.apiKey,
              collections.optionCollectionId,
              option,
              siteId,
            );
            if (result.error) {
              await logError(
                `Error adding option to Webflow: ${result.error}`,
                siteId,
                payload,
              );
            }
            return result;
          }),
        ),
      );
    }

    // Modifiers
    if (filteredModifiersArray.data.length > 0) {
      promises.push(
        Promise.all(
          filteredModifiersArray.data.map(async (modifier: any) => {
            const result = await ModifierService.create(
              payload.apiKey,
              collections.modifierCollectionId,
              modifier,
              siteId,
            );
            if (result.error) {
              await logError(
                `Error adding modifier to Webflow: ${result.error}`,
                siteId,
                payload,
              );
            }
            return result;
          }),
        ),
      );
    }

    // Variants
    if (filteredVariantsArray.data.length > 0) {
      promises.push(
        Promise.all(
          filteredVariantsArray.data.map(async (variant: any) => {
            const result = await VarientService.create(
              payload.apiKey,
              collections.variantCollectionId,
              variant,
              siteId,
            );
            if (result.error) {
              await logError(
                `Error adding variant to Webflow: ${result.error}`,
                siteId,
                payload,
              );
            }
            return result;
          }),
        ),
      );
    }

    // Products
    if (filteredProductsArray.data.length > 0) {
      promises.push(
        Promise.all(
          filteredProductsArray.data.map(async (product: any) => {
            const result = await ProductService.create(
              payload.apiKey,
              collections.productCollectionId,
              product,
              siteId,
              payload.locationUuid,
            );
            if (result.error) {
              await logError(
                `Error adding product to Webflow: ${result.error}`,
                siteId,
                payload,
              );
            }
            return result;
          }),
        ),
      );
    }

    // Categories
    if (filteredCategoriesArray.data.length > 0) {
      promises.push(
        Promise.all(
          filteredCategoriesArray.data.map(async (category: any) => {
            const result = await CategoryService.create(
              payload.apiKey,
              collections.categoryCollectionId,
              category,
              siteId,
              payload.locationUuid,
            );
            if (result.error) {
              await logError(
                `Error adding category to Webflow: ${result.error}`,
                siteId,
                payload,
              );
            }
            return result;
          }),
        ),
      );
    }

    // Menus
    if (filteredMenusArray.data.length > 0) {
      promises.push(
        Promise.all(
          filteredMenusArray.data.map(async (menu: any) => {
            const result = await MenuService.create(
              payload.apiKey,
              collections.menuCollectionId,
              menu,
              siteId,
              payload.locationUuid,
            );
            if (result.error) {
              await logError(
                `Error adding menu to Webflow: ${result.error}`,
                siteId,
                payload,
              );
            }
            return result;
          }),
        ),
      );
    }

    // Wait for all promises to resolve
    await Promise.all(promises);

    // Send success email
    await AwsEmailClient.sendMailUsingMailer({
      to: 'dev@ionixsystems.com',
      subject: 'Import Success',
      html: `<div><h3>Success</h3><p>Data Imported Successfully</p></div>`,
    });

    return getSuccessResponse('Data imported successfully');
  } catch (error) {
    await logError(`Error in importData: ${error}`, siteId, payload);
    return getErrorResponse('Error importing data');
  }
};

// Helper function to log errors
const logError = async (errorMsg: string, siteId: any, payload: any) => {
  console.error(errorMsg);
  await ErrorLog.logErrorToDb(
    '500', // Adjust error code as needed
    errorMsg,
    siteId,
    payload,
  );
};
