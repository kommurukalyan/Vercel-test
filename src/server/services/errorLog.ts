import prisma from '@/lib/prisma';
import { isEmpty } from 'lodash';

export default class ErrorLog {
  public static logErrorToDb = async (
    errorType: string,
    errorMessage: string,
    siteId?: number,
    payload?: any,
    apiConfig?: any,
  ) => {
    try {
      let payloadJson, apiUrl;
      if (!isEmpty(payload)) {
        payloadJson = JSON.stringify(payload);
      }
      if (!isEmpty(apiConfig)) {
        apiUrl = `${apiConfig.method} ${apiConfig.url}`;
      }
      await prisma.errorLog.create({
        data: {
          errorType: errorType,
          error: errorMessage,
          ...(siteId && { siteId: siteId }),
          ...(payload && { payload: payloadJson }),
          ...(apiUrl && { apiUrl: apiUrl }),
        },
      });

      await prisma.site.update({
        where: { id: siteId },
        data: { isWebhookFailed: true, errorMsg: errorMessage },
      });
    } catch (error) {
      console.log(error, 'error while error-logging');
    }
  };
}
