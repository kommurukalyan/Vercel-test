import { NextApiResponse } from 'next';

import * as siteController from '@/server/controllers/siteController';
import { NextRequestWithUser } from '@/types';
import { STANDARD_ERROR_MSG } from '@/lib/constants';
import { checkToken } from '@/lib/security';

export default async function UpdateSiteHandler(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    // DELETE /api/sites/:siteId
    if (req.method === 'DELETE') {
      const error = await checkToken(req);
      if (error) {
        return res.status(error.status).send({ msg: error.msg, error: true });
      }
      return siteController.deleteSite(req, res);
    }
    // PUT /api/sites/:siteId
    if (req.method === 'PUT') {
      const error = await checkToken(req);
      if (error) {
        return res.status(error.status).send({ msg: error.msg, error: true });
      }
      //return siteController.updateSite(req, res);
    }
    return res.status(404).send({ msg: 'Invalid Request' });
  } catch (error) {
    return res.status(400).send({ msg: STANDARD_ERROR_MSG });
  }
}
