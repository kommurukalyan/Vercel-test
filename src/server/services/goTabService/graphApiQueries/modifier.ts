import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import fetchGotabApi from '../api';
import { Modifier_Schema, Option_Schema } from '../graphApiSchema';
import _ from 'lodash';
//Gotab's Modifiers Query
export const getModifiersQuery = `
query ModifiersListQuery($filter: ProductFilter) {
    productsList(filter: $filter) {
      productUuid
      modifiers {
         ${Modifier_Schema}
          options{
            ${Option_Schema}
          }
     
         }
  }
}

 `;
//A method to fetch the Gotab ModifiersData
export const getModifiers = async (locationId: string) => {
  const modifiersData = await fetchGotabApi(
    {
      query: getModifiersQuery,
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
  const response = await modifiersData.json();
  //extracting modifiers from products
  const modifiers = response?.data?.productsList?.map(
    (ele: any) => ele?.modifiers,
  );
  //merging all modifiers into a single array
  const mergedmodifiersArray1 = [].concat.apply([], modifiers);
  //filtering modifiers to remove duplicates
  const filteredModifiersArrayWithoutDuplicates = _.uniqBy(
    mergedmodifiersArray1,
    'uid',
  );
  //filtering the modifiers that are enabled to true
  const filteredModifiersArraywithEnabled =
    filteredModifiersArrayWithoutDuplicates?.filter(
      (ele: any) => ele?.enabled === true,
    );
  return getSuccessResponse('Success', filteredModifiersArraywithEnabled);
};
