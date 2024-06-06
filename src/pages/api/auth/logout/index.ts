import { NextApiResponse } from 'next';

import { getSuccessResponse } from '@/server/serverUtils/helpers';
import { NextRequestWithUser } from '@/types';
import { COOKIE_KEY, STANDARD_ERROR_MSG } from '@/lib/constants';

const deleteCookie = (res: NextApiResponse) => {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  );
};
export default async function authHandler(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    // POST /api/auth/logout
    if (req.method === 'POST') {
      deleteCookie(res);
      return res.send(getSuccessResponse('Logout successful'));
    }
    return res.status(404).send({ msg: 'Invalid Request' });
  } catch (error) {
    return res.status(400).send({ msg: STANDARD_ERROR_MSG });
  }
}
