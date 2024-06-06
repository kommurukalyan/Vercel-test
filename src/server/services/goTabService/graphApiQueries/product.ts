import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import fetchGotabApi from '../api';
import {
  Modifier_Schema,
  Option_Schema,
  Product_Schema,
  Variant_Schema,
} from '../graphApiSchema';
import _ from 'lodash';
//Gotab's Products Query
export const getProductsQuery = `
query ProductListQuery($filter: ProductFilter) {
    productsList(filter: $filter) {
      ${Product_Schema}
      modifiers{
        ${Modifier_Schema}
      }
      variantsList{
        ${Variant_Schema}
      }
  }
}

 `;

//Gotab's ProductById Query to fetch single product
export const getProductByIdQuery = `
 query Product($productId: BigInt!) {
  product(productId: $productId) {
         ${Product_Schema}
      modifiers{
        ${Modifier_Schema}
        options{
          ${Option_Schema}
         }
      }
      variantsList{
        ${Variant_Schema}
      }
    }

    }

 `;

//A method to fetch the Gotab ProductsData
export const getProducts = async (locationId: string) => {
  const productsData = await fetchGotabApi(
    {
      query: getProductsQuery,
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

  const response = await productsData.json();

  //filtering the products that are unique and no duplicates
  const filteredProductsArraywithoutDuplicates = _.uniqBy(
    response?.data?.productsList,
    'productUuid',
  );
  const filteredProductsArraywithCategoryId =
    filteredProductsArraywithoutDuplicates?.filter(
      (ele: any) => ele?.categoryId !== null,
    );
  return getSuccessResponse('Success', filteredProductsArraywithCategoryId);
};

//A method to fetch the Gotab's Single Product Data by Id
export const getProductById = async (productId: string) => {
  const productData = await fetchGotabApi(
    {
      query: getProductByIdQuery,
      variables: {
        productId: productId,
      },
    },
    'post',
  );

  const response = await productData.json();
  if (response.data) {
    const product = response.data.product;
    const modifiers = response.data.product.modifiers;
    const filteredModifiers = modifiers.filter((ele: any) => ele !== null);
    //filtering the modifiers that are enabled to true
    const options = modifiers
      .map((ele: any) => ele.options)
      .filter((ele: any) => ele !== null);
    const mergedOptionsArray = [].concat.apply([], options);
    const filteredOptionsArrayWithoutDuplicates = _.uniqBy(
      mergedOptionsArray,
      'uid',
    );

    const variants = response.data.product.variantsList;

    return getSuccessResponse('Success', {
      product: product,
      modifiers: filteredModifiers,
      options: filteredOptionsArrayWithoutDuplicates,
      variants: variants,
    });
  } else {
    return getErrorResponse('Error fetching product data', response.errors);
  }
};
