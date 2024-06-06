// api/amc/request
import { NextApiResponse } from 'next';

import * as siteController from '@/server/controllers/siteController';
import { NextRequestWithUser } from '@/types';
import { STANDARD_ERROR_MSG } from '@/lib/constants';
import { getAppErrorResponse } from '@/lib/helper';
import { checkToken } from '@/lib/security';

export default async function RepollDataHandler(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    // POST /api/sites/repoll/:siteId
    
    if (req.method === 'POST') {
      const error = await checkToken(req);
      if (error) {
        return res
          .status(error.status)
          .send(getAppErrorResponse(403, 'Unauthorized access', 403));
      }
      return siteController.repollData(req, res);
    }
    return res.status(404).send({ msg: 'Invalid Request' });
  } catch (error) {
    return res.status(400).send({ msg: STANDARD_ERROR_MSG });
  }
}
