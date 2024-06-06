import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NextApiResponse } from 'next';

import LoginRquest from '@/server/request/loginRquest';
import {
  formatPayloadError,
  getErrorResponse,
} from '@/server/serverUtils/helpers';
import logger from '@/server/serverUtils/logger';
import AuthService from '@/server/services/authService';
import { NextRequestWithUser } from '@/types';
import { STANDARD_ERROR_MSG } from '@/lib/constants';
import { COOKIE_KEY } from '@/lib/constants';
import PasswordChangeRequest from '@/server/request/passwordChangeRequest';

const getCookieExpiry = () => {
  const currentDate = new Date();

  // Add 1 minute less than 30 days to the current date
  const futureDate = new Date();
  futureDate.setDate(currentDate.getDate() + Number(30));
  futureDate.setMinutes(futureDate.getMinutes() - 1);

  const timeDifference = Math.abs(futureDate.getTime() - currentDate.getTime());
  const maxAge = Math.floor(timeDifference / 1000);

  return { maxAge };
};

const setCookie = (res: NextApiResponse, token: string) => {
  const { maxAge } = getCookieExpiry();
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_KEY}=${token}; Secure=${
      process.env.APP_ENV === 'production'
    }; Max-Age=${maxAge}; Path=/; SameSite=Strict; HttpOnly`,
  );
};

// eslint-disable-next-line import/prefer-default-export
export async function handleLogin(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    const loginPayload = plainToInstance(LoginRquest, req.body);
    const errors = await validate(loginPayload);

    if (errors.length) {
      const constraints = formatPayloadError(errors);
      return res.send(getErrorResponse('Invalid Request.', constraints));
    }

    const response = await AuthService.login(loginPayload);

    return res.send(response);
  } catch (error) {
    logger.log(error, 'error');
    return res.status(400).send({ msg: STANDARD_ERROR_MSG });
  }
}

export async function handleChangePassword(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    const payload = plainToInstance(PasswordChangeRequest, req.body);
    const errors = await validate(payload);

    if (errors.length) {
      const constraints = formatPayloadError(errors);
      return res.send(getErrorResponse('Invalid Request.', constraints));
    }

    const data = await AuthService.updatePassword(req.user.id, payload);
    return res.send(data);
  } catch (error) {
    return res.status(400).send({ msg: STANDARD_ERROR_MSG });
  }
}
