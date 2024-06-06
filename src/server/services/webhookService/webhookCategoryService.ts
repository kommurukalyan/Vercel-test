import prisma from '@/lib/prisma';
import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import logger from '@/server/serverUtils/logger';
import CategoryService from '../categoryService';
import { getCategoryById } from '../goTabService/graphApiQueries/category';
import EncryptionClient from '@/server/serverUtils/EncryptionClient';
import ErrorLog from '../errorLog';

export default class WebhookCategoryService {
  //method that triggers when category-updated webhook is triggered
  public static updateWebhookCategory = async (payload: any) => {
    try {
      const goTabCategoryResult = await getCategoryById(payload.target_id);
      const locationDetails = await prisma.location.findUnique({
        include: {
          Site: true,
        },
        where: {
          locationUuid: payload.location_uuid,
        },
      });
      if (!goTabCategoryResult.error) {
        const middlewareCategory = await prisma.category.findUnique({
          include: {
            Site: true,
          },
          where: {
            gotabCategoryId: payload.target_id,
          },
        });
        //checking if the category exists in our middleware db
        if (middlewareCategory) {
          //fetching gotab category data by id
          const goTabCategoryResult = await getCategoryById(payload.target_id);
          //checking if the gotab's category's archived flag is null i.e., it is not deleted and enabled flag to true
          if (
            goTabCategoryResult.data.category.archived === null &&
            goTabCategoryResult.data.category.enabled === true
          ) {
            if (goTabCategoryResult) {
              //updating the webflow category
              const updatedWebflowCategory = await CategoryService.update(
                middlewareCategory?.Site?.apiKey as string,
                middlewareCategory?.Site?.webflowCategoryCollectionId,
                goTabCategoryResult.data.category,
                middlewareCategory,
              );
              if (!updatedWebflowCategory.error) {
                return getSuccessResponse('Category Updated Successfully');
              } else {
                const errorMsg = `Error updating a Category during CATEGORY_UPDATED webhook, ${updatedWebflowCategory.errors.response.data.message}`;
                await ErrorLog.logErrorToDb(
                  updatedWebflowCategory.errors.response.data.code,
                  errorMsg,
                  middlewareCategory?.Site?.id,
                  middlewareCategory,
                  updatedWebflowCategory?.errors?.response.config,
                );
                return getErrorResponse(errorMsg, updatedWebflowCategory);
              }
            }
          } else {
            //if the archived flag of gotab category is not null i.e., it is deleted in gotab
            const deletedCategory = await CategoryService.delete(
              middlewareCategory?.Site?.apiKey as string,
              middlewareCategory?.Site?.webflowCategoryCollectionId as string,
              middlewareCategory,
              middlewareCategory?.Site?.id,
            );
            if (!deletedCategory?.error) {
              return getSuccessResponse(
                'category is completely Removed Successfully as it is not available',
              );
            } else {
              const errorMsg = `Error deleting a category during CATEGORY_UPDATED webhook, ${deletedCategory.errors.response.data.message}`;
              await ErrorLog.logErrorToDb(
                deletedCategory.errors.response.data.code,
                errorMsg,
                middlewareCategory?.Site?.id,
                middlewareCategory,
                deletedCategory?.errors?.response.config,
              );
              return getErrorResponse(errorMsg, deletedCategory);
            }
          }
        } else {
          //if the category is not found in middleware,a new category is created
          //fetching gotab's categopry data by id
          const goTabCategoryResult = await getCategoryById(payload.target_id);
          const locationDetails = await prisma.location.findUnique({
            include: {
              Site: true,
            },
            where: {
              locationUuid: payload.location_uuid,
            },
          });
          if (
            goTabCategoryResult &&
            goTabCategoryResult.data.category.enabled === true
          ) {
            const decryptedApiKey = EncryptionClient.decryptData(
              locationDetails?.Site?.apiKey as string,
            );
            //adding the new category to webflow cms
            const addNewWebflowCategory = await CategoryService.create(
              decryptedApiKey as string,
              locationDetails?.Site?.webflowCategoryCollectionId,
              goTabCategoryResult.data.category,
              locationDetails?.Site?.id as number,
            );
            if (!addNewWebflowCategory?.error) {
              return getSuccessResponse('New Category added Successfully');
            } else {
              const errorMsg = `Error Adding a new category during CATEGORY_UPDATED webhook, ${addNewWebflowCategory.errors.response.data.message}`;
              await ErrorLog.logErrorToDb(
                addNewWebflowCategory.errors.response.data.code,
                errorMsg,
                locationDetails?.Site?.id,
                middlewareCategory,
                addNewWebflowCategory?.errors?.response.config,
              );
              return getErrorResponse(errorMsg, addNewWebflowCategory);
            }
          } else {
            return getSuccessResponse(
              'Not adding this category as it is not enabled',
            );
          }
        }
      } else {
        const errorMsg = `Error fetching gotabCategory result during CATEGORY_UPDATED webhook, ${goTabCategoryResult?.errors[0]?.message}`;
        await ErrorLog.logErrorToDb(
          'Schema Mismatch/property not found',
          errorMsg,
          locationDetails?.Site?.id,
          locationDetails,
        );
        return getErrorResponse(errorMsg, goTabCategoryResult);
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse();
    }
  };
}
