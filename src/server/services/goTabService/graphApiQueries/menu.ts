import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import { MENU_Category_Schema, Menu_Schema } from '../graphApiSchema';
import fetchGotabApi from '../api';
import _ from 'lodash';
//Gotab's Menus Query
export const getMenusQuery = `
query MenuListQuery($filter: MenuFilter) {
    menus(filter: $filter)  {
       ${Menu_Schema}
      menuCategoriesList {
        ${MENU_Category_Schema}
      }
      }
    } `;

export const getMenuByIdQuery = `
    query Menu( $menuId: BigInt!){
      menu(menuId: $menuId) {
        ${Menu_Schema}
        menuCategoriesList {
          ${MENU_Category_Schema}
        }
      }
      }`;
//A method to fetch the Gotab MenusData
export const getMenus = async (locationId: string) => {
  const menusData = await fetchGotabApi(
    {
      query: getMenusQuery,
      variables: {
        filter: {
          locationId: {
            equalTo: locationId,
          },
          available: {
            equalTo: true,
          },
          enabled: {
            equalTo: true,
          },
        },
      },
    },
    'post',
  );
  const response = await menusData.json();
  //filtering menus to remove duplicates
  const filteredMenusArraywithoutDuplicates = _.uniqBy(
    response?.data?.menus,
    'menuId',
  );
  return getSuccessResponse('Success', filteredMenusArraywithoutDuplicates);
};

//A method to fetch the Gotab's single Menu Data by Id
export const getMenuById = async (menuId: string) => {
  const menusData = await fetchGotabApi(
    {
      query: getMenuByIdQuery,
      variables: {
        menuId: menuId,
      },
    },
    'post',
  );
  const response = await menusData.json();
  if (response.data) {
    return getSuccessResponse('Success', response.data);
  } else {
    return getErrorResponse('Error fetching menu data', response.errors);
  }
};
