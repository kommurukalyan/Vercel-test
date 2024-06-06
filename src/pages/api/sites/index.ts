// api/amc/request
import { NextApiResponse } from 'next';

import * as siteController from '@/server/controllers/siteController';
import { NextRequestWithUser } from '@/types';
import { STANDARD_ERROR_MSG } from '@/lib/constants';
import { getAppErrorResponse } from '@/lib/helper';
import { checkToken } from '@/lib/security';

export default async function SiteHandler(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    // GET /api/sites
    if (req.method === 'GET') {
      const error = await checkToken(req);
      if (error) {
        return res
          .status(error.status)
          .send(getAppErrorResponse(403, 'Unauthorized access', 403));
      }
      return siteController.getSites(req, res);
    }
    // POST /api/sites
    if (req.method === 'POST') {
      const error = await checkToken(req);
      if (error) {
        return res
          .status(error.status)
          .send(getAppErrorResponse(403, 'Unauthorized access', 403));
      }
      return siteController.createSite(req, res);
    }
    return res.status(404).send({ msg: 'Invalid Request' });
  } catch (error) {
    return res.status(400).send({ msg: STANDARD_ERROR_MSG });
  }
}
