import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import fetchGotabApi from '../api';
import { Modifier_Schema, Option_Schema } from '../graphApiSchema';
import _ from 'lodash';
//Gotab's OptionsQuery
export const getOptionsQuery = `
query OptionsListQuery($filter: ProductFilter) {
    productsList(filter: $filter) {
      modifiers {
        ${Modifier_Schema}
          options {
             ${Option_Schema}
            }
         }
  }
}

 `;
//A method to fetch the Gotab OptionsData
export const getOptions = async (locationId: string) => {
  const optionsData = await fetchGotabApi(
    {
      query: getOptionsQuery,
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
  const response = await optionsData.json();
  //extracting modifiers from products
  const modifiers = response?.data?.productsList?.map(
    (ele: any) => ele?.modifiers,
  );
  //merging all modifiers into a single array
  const mergedmodifiersArray1 = [].concat.apply([], modifiers);

  const filteredModifiersArrayWithoutDuplicates = _.uniqBy(
    mergedmodifiersArray1,
    'uid',
  );
  //filtering the modifiers that are enabled to true
  const filteredModifiersArraywithEnabled =
    filteredModifiersArrayWithoutDuplicates?.filter(
      (ele: any) => ele?.enabled === true,
    );
  //extracting options from modifiers
  const Options = filteredModifiersArraywithEnabled?.map(
    (ele: any) => ele?.options,
  );
  //merging options into a single array
  const mergedOptionsArray = [].concat.apply([], Options);
  //filtering options to remove duplicates
  const filteredOptionsArrayWithoutDuplicates = _.uniqBy(
    mergedOptionsArray,
    'uid',
  );
  //filtering the options that are enabled to true
  const filteredOptionsArraywithEnabled =
    filteredOptionsArrayWithoutDuplicates.filter(
      (ele: any) => ele?.enabled === true,
    );
  return getSuccessResponse('Success', filteredOptionsArraywithEnabled);
};
