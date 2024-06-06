// api/amc/request
import { NextApiResponse } from 'next';

import * as webhookController from '@/server/controllers/webhookController';
import { NextRequestWithUser } from '@/types';
import { STANDARD_ERROR_MSG } from '@/lib/constants';

export default async function orderHandler(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    // POST /api/webhooks/gotab
    if (req.method === 'POST') {
      return webhookController.createWebhook(req, res);
    }
    return res.status(404).send({ msg: 'Invalid Request' });
  } catch (error) {
    return res.status(400).send({ msg: STANDARD_ERROR_MSG });
  }
}
