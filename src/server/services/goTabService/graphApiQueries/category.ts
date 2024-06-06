import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import fetchGotabApi from '../api';
import { Category_Schema, Product_Schema } from '../graphApiSchema';
import _ from 'lodash';
//Gotab's Category Query
export const getCategoriesQuery = `
query CategoryListQuery($filter: CategoryFilter) {
    categoriesList(filter: $filter) {
    ${Category_Schema}
     productsList{
        ${Product_Schema}

   }
   }
}

 `;
//Gotab's CategoryById Query to fetch single category
export const getCategoryByIdQuery = `
 query Category($categoryId: BigInt!) {
  category(categoryId: $categoryId) {
      ${Category_Schema}
      productsList{
        ${Product_Schema}

   }
  }
}

 `;

//A method to fetch the Gotab CategoryData
export const getCategories = async (locationId: string) => {
  const categoriesData = await fetchGotabApi(
    {
      query: getCategoriesQuery,
      variables: {
        filter: {
          locationId: {
            equalTo: locationId,
          },
          archived: {
            isNull: true,
          },
          enabled: {
            equalTo: true,
          },
        },
      },
    },
    'post',
  );
  const response = await categoriesData.json();
  //filtering categories to remove duplicates
  const filteredCategoriesArraywithoutDuplicates = _.uniqBy(
    response?.data?.categoriesList,
    'categoryId',
  );
  return getSuccessResponse(
    'Success',
    filteredCategoriesArraywithoutDuplicates,
  );
};

//A method to fetch the Gotab's single Category Data by Id
export const getCategoryById = async (categoryId: string) => {
  const categoryData = await fetchGotabApi(
    {
      query: getCategoryByIdQuery,
      variables: {
        categoryId: categoryId,
      },
    },
    'post',
  );
  const response = await categoryData.json();
  if (response.data) {
    return getSuccessResponse('Success', response.data);
  } else {
    return getErrorResponse('Error fetching menu data', response.errors);
  }
};
