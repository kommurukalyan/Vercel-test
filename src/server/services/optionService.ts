import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import CollectionService from './collectionService';
import prisma from '@/lib/prisma';
import logger from '../serverUtils/logger';
import EncryptionClient from '../serverUtils/EncryptionClient';
import { convertToDollars } from '../serverUtils/webflowHelpers';

export default class OptionService {
  public static create = async (
    apiKey: string,
    optionCollectionId: any,
    payload: any,
    siteId: number,
  ) => {
    try {
      const displayPrice = await convertToDollars(payload.price);
      let fieldData = {
        enabled: payload.enabled,
        key: payload.key,
        price: payload.price,
        rank: payload.rank,
        required: payload.required,
        uid: payload.uid,
        name: payload.name,
        displayprice: displayPrice,
      };

      const createdOption = await CollectionService.create(
        optionCollectionId,
        apiKey,
        fieldData,
      );
      if (!createdOption.error) {
        await prisma.option.create({
          data: {
            webflowOptionId: createdOption.data.id,
            siteId: siteId,
            gotabOptionuid: payload.uid,
          },
        });
        return getSuccessResponse('success', createdOption);
      } else {
        return createdOption;
      }
    } catch (error: any) {
      //logger.log(error, undefined, 'error');
      return getErrorResponse(error);
    }
  };
  public static update = async (
    apiKey: string,
    optionCollectionId: any,
    payload: any,
    middlewareOption: any,
  ) => {
    try {
      const displayPrice = await convertToDollars(payload.price);
      let fieldData = {
        enabled: payload.enabled,
        key: payload.key,
        price: payload.price,
        rank: payload.rank,
        required: payload.required,
        uid: payload.uid,
        name: payload.name,
        displayprice: displayPrice,
      };
      const updatedOption = await CollectionService.update(
        optionCollectionId,
        middlewareOption?.webflowOptionId,
        apiKey,
        fieldData,
      );
      if (!updatedOption.error) {
        return getSuccessResponse('success', updatedOption);
      } else {
        return updatedOption;
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse('Error updating OptionUuid' + payload.uid);
    }
  };

  //method to add updated options to webflow
  public static addOptionsToWebflowModifier = async (
    apiKey: string,
    gotabModifierid: any,
    siteId: any,
  ) => {
    //fetching all the options that are having isDeleted to false
    const mappedOptionsToModifier = await prisma.option.findMany({
      where: {
        gotabModifieruid: gotabModifierid,
        isDeleted: false,
        siteId: siteId,
      },
    });
    //mapping all options to get webflowids
    const webflowOptionIdsOfModifier = mappedOptionsToModifier.map(
      (ele: any) => {
        return ele.webflowOptionId;
      },
    );
    //fetching middleware modifier
    const middlewareModifier = await prisma.modifier.findUnique({
      include: {
        Site: true,
      },
      where: {
        gotabModifieruid: gotabModifierid,
      },
    });
    let fieldData = { options: webflowOptionIdsOfModifier };
    //updating the modifieer with updated options
    const updatedModifier = await CollectionService.update(
      middlewareModifier?.Site?.webflowModifierCollectionId as string,
      middlewareModifier?.webflowModifierId,
      apiKey,
      fieldData,
    );
    if (updatedModifier) {
      return updatedModifier;
    }
    return getSuccessResponse(
      'options updated to a Modifier Successfully',
      updatedModifier,
    );
  };

  public static delete = async (
    apiKey: string,
    collectionId: any,
    payload: any,
    siteId: any,
  ) => {
    try {
      //fetching middleware option details
      const middlewareOption = await prisma.option.findUnique({
        where: { gotabOptionuid: payload.gotabOptionuid, siteId: siteId },
      });
      //updating the option in table with isdeleted flag to true
      const updateOptioninMiddlewareDb = await prisma.option.update({
        where: { id: middlewareOption?.id, siteId: siteId },
        data: { isDeleted: true },
      });
      if (updateOptioninMiddlewareDb) {
        //adding updated options to modifier
        const removeOptionFromModifier = await this.addOptionsToWebflowModifier(
          apiKey as string,
          middlewareOption?.gotabModifieruid,
          siteId,
        );
        if (!removeOptionFromModifier.error) {
          //deleting the modifier
          const deletedOption = await CollectionService.delete(
            collectionId,
            middlewareOption?.webflowOptionId,
            apiKey,
          );
          if (!deletedOption.error) {
            //removing the modifier
            const removedOption = await CollectionService.remove(
              collectionId,
              middlewareOption?.webflowOptionId,
              apiKey,
            );
            if (!removedOption.error) {
              //completely removing the option from the middleware db
              await prisma.option.delete({
                where: { gotabOptionuid: payload?.gotabOptionuid },
              });

              return getSuccessResponse('success', removedOption);
            } else {
              return removedOption;
            }
          } else {
            return deletedOption;
          }
        } else {
          return removeOptionFromModifier;
        }
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse('Error deleting OptionUuid' + payload.optionUuid);
    }
  };

  public static sync = async (
    apiKey: string,
    optionCollectionId: any,
    payload: any,
    siteId: number,
  ) => {
    try {
      const middlewareOption = await prisma.option.findUnique({
        where: { gotabOptionuid: payload.uid, siteId: siteId },
      });
      if (!middlewareOption && payload.enabled) {
        const decryptedApiKey = EncryptionClient.decryptData(apiKey as string);
        return this.create(
          decryptedApiKey,
          optionCollectionId,
          payload,
          siteId,
        );
      } else {
        if (payload.enabled) {
          return this.update(
            apiKey,
            optionCollectionId,
            payload,
            middlewareOption,
          );
        } else
          return this.delete(
            apiKey,
            optionCollectionId,
            middlewareOption,
            siteId,
          );
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse(
        'Error syncing OptionUuid' + payload?.uid + ' for siteId' + siteId,
      );
    }
  };

  public static async getByOptionUid(options: any, siteId: any) {
    const optionsList = await prisma.option.findMany({
      where: {
        gotabOptionuid: {
          in: options,
        },
        siteId: siteId,
      },
    });
    const finalOptionsList = optionsList?.map(
      (ele: any) => ele.webflowOptionId,
    );
    return finalOptionsList;
  }
}
