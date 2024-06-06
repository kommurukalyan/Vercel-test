import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import fetchGotabApi from '../api';
import { Variant_Schema } from '../graphApiSchema';
import _ from 'lodash';
//Gotab's Variants Query
export const getVariantsQuery = `
query VariantListQuery($filter: ProductFilter) {
    productsList(filter: $filter) {
      variantsList {
          ${Variant_Schema}
              }
  }
}

 `;
//A method to fetch the Gotab VariantsData
export const getVariants = async (locationId: string) => {
  const variantsData = await fetchGotabApi(
    {
      query: getVariantsQuery,
      variables: {
        filter: {
          locationId: {
            equalTo: locationId,
          },
          available: {
            equalTo: true,
          },
        },
      },
    },
    'post',
  );
  const response = await variantsData.json();
  //extracting variants from products
  const variants = response?.data?.productsList?.map(
    (ele: any) => ele?.variantsList,
  );
  //merging variants into a single array
  const mergedVariantsArray = [].concat.apply([], variants);
  //filtering variants that are unique and no duplicates
  const filteredVariantsArray = _.uniqBy(mergedVariantsArray, 'sku');
  //filtering the variants that have archived as null
  const filteredVariantsArraywithArchivedNull = filteredVariantsArray?.filter(
    (ele: any) => ele?.archived === null,
  );
  return getSuccessResponse('Success', filteredVariantsArraywithArchivedNull);
};
