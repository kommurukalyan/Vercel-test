import { NextApiResponse } from 'next';

import * as authController from '@/server/controllers/authController';
import { NextRequestWithUser } from '@/types';
import { STANDARD_ERROR_MSG } from '@/lib/constants';

export default async function authHandler(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    // POST /api/auth/login
    if (req.method === 'POST') {
      return authController.handleLogin(req, res);
    }
    return res.status(404).send({ msg: 'Invalid Request' });
  } catch (error) {
    return res.status(400).send({ msg: STANDARD_ERROR_MSG });
  }
}
