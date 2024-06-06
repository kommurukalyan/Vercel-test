import { NextApiRequest, NextApiResponse } from 'next';

import config from '@/server/serverUtils/config';
import logger from '@/server/serverUtils/logger';
import webhookService from '@/server/services/webhookService';
import { getAppErrorResponse } from '@/lib/helper';

// eslint-disable-next-line import/prefer-default-export
export async function createWebhook(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.headers['x-ionix-application-id'] === config.appId) {
      const response = await webhookService.createWebhook(req);
      return res.send(response);
    } else {
      return res
        .status(401)
        .send('UnAuthorized due to incorrect x-ionix-applicationId');
    }
  } catch (error) {
    logger.log(error, 'error');
    return res.status(400).send(getAppErrorResponse(400));
  }
}
