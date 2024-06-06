import { NextApiResponse } from 'next';

import * as authController from '@/server/controllers/authController';
import { NextRequestWithUser } from '@/types';
import { STANDARD_ERROR_MSG } from '@/lib/constants';
import { checkToken } from '@/lib/security';

export default async function validateHandler(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    // POST /api/auth/change-password
    if (req.method === 'POST') {
      const error = await checkToken(req);
      if (error) {
        return res.status(error.status).send({ msg: error.msg, error: true });
      }
      return authController.handleChangePassword(req, res);
    }
    return res.status(404).send({ msg: 'Invalid Request' });
  } catch (error) {
    return res.status(400).send({ msg: STANDARD_ERROR_MSG });
  }
}
