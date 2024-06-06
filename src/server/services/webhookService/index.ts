import { getErrorResponse } from '@/server/serverUtils/helpers';
import logger from '@/server/serverUtils/logger';

import _ from 'lodash';

import AwsEmailClient from '@/server/serverUtils/AwsClient/emailClient';
import WebhookLocationService from './webhookLocationService';
import WebhookCategoryService from './webhookCategoryService';
import WebhookMenuService from './webhookMenuService';
import WebhookProductService from './webhookProductService';
import prisma from '@/lib/prisma';
import { ElevatorSharp } from '@mui/icons-material';

export default class WebhookService {
  public static createWebhook = async (payload: any) => {
    try {
      // added email to test the payload
      if (payload.body.location_uuid === 'a5gSfoPJZxc3q58mP49w2ZmL') {
        await AwsEmailClient.sendMailUsingMailer({
          to: 'dev@ionixsystems.com',
          subject: 'webhooks data',
          html: `
        <div>
        <h3>Response Body</h3>
        <p>${JSON.stringify(payload.body)}</p>
        <h3>Headers</h3>
        <p>${JSON.stringify(payload.headers)}</p>

        </div>
        `,
        });
      }
      //testing whether the data or cause of the webhook payload is empty
      if (_.isEmpty(payload.body.data) || payload.body.data.cause === null) {
        switch (payload.body.type) {
          case 'LOCATION_UPDATED':
            const locationDetails = await prisma.site.findUnique({
              where: {
                locationUuid: payload.body.location_uuid,
                isDeleted: false,
              },
            });
            if (locationDetails != null) {
              return await WebhookLocationService.updateWebhookLocation(
                payload.body,
              );
            } else {
              return getErrorResponse(
                'Location is Deleted,so LOCATION-UPDATED webhook wont work',
              );
            }

          case 'PRODUCT_UPDATED':
            const productLocationDetails = await prisma.site.findUnique({
              where: {
                locationUuid: payload.body.location_uuid,
                isDeleted: false,
              },
            });
            if (productLocationDetails != null) {
              return await WebhookProductService.updateWebhookProduct(
                payload.body,
              );
            } else {
              return getErrorResponse(
                'Location is Deleted,so PRODUCT-UPDATED webhook wont work',
              );
            }

          case 'CATEGORY_UPDATED':
            const categoryLocationDetails = await prisma.site.findUnique({
              where: {
                locationUuid: payload.body.location_uuid,
                isDeleted: false,
              },
            });
            if (categoryLocationDetails != null) {
              return await WebhookCategoryService.updateWebhookCategory(
                payload.body,
              );
            } else {
              return getErrorResponse(
                'Location is Deleted,so CATEGORY-UPDATED webhook wont work',
              );
            }

          case 'MENU_UPDATED':
            const menuLocationDetails = await prisma.site.findUnique({
              where: {
                locationUuid: payload.body.location_uuid,
                isDeleted: false,
              },
            });
            if (menuLocationDetails != null) {
              return await WebhookMenuService.updateWebhookMenu(payload.body);
            } else {
              return getErrorResponse(
                'Location is Deleted,so MENU-UPDATED webhook wont work',
              );
            }

          default:
            return getErrorResponse('Not a Valid Webhook');
        }
      } else {
        return getErrorResponse('Not a Valid Webhook');
      }
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse();
    }
  };
}
