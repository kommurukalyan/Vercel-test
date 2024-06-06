import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NextApiRequest, NextApiResponse } from 'next';

import AddSiteRequest from '@/server/request/addSiteRequest';
import {
  formatPayloadError,
  getAppErrorResponse,
  getErrorResponse,
} from '@/server/serverUtils/helpers';
import logger from '@/server/serverUtils/logger';
import siteService from '@/server/services/siteService';
import { NextRequestWithUser } from '@/types';
import { STANDARD_ERROR_MSG } from '@/lib/constants';

// eslint-disable-next-line import/prefer-default-export
export async function getSites(req: NextRequestWithUser, res: NextApiResponse) {
  try {
    const response = await siteService.getSites(req.user.id);

    return res.send(response);
  } catch (error) {
    logger.log(error, 'error');
    return res.status(400).send(getAppErrorResponse(400));
  }
}
export async function createSite(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    const payload = plainToInstance(AddSiteRequest, req.body);

    const errors = await validate(payload);
    if (errors.length) {
      const constraints = formatPayloadError(errors);
      return res.send(getErrorResponse('Invalid Request.', constraints));
    }

    const response = await siteService.createSite(payload, req.user.id);

    return res.send(response);
  } catch (error) {
    logger.log(error, 'error');
    return res.status(400).send(getAppErrorResponse(400));
  }
}
export async function deleteSite(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    const siteId = req.query.siteId;
    if (!siteId) {
      return res.send(
        getErrorResponse('Invalid Request.', {
          siteId: 'site ID is missing',
        }),
      );
    }
    const parsedSiteId = parseInt(siteId as string, 10);
    const data = await siteService.deleteSite(parsedSiteId, req.user.id);
    return res.send(data);
  } catch (error) {
    return res.status(400).send({ msg: STANDARD_ERROR_MSG });
  }
}

export async function repollData(
  req: NextRequestWithUser,
  res: NextApiResponse,
) {
  try {
    const siteId = req.query.siteId;
    if (!siteId) {
      return res.send(
        getErrorResponse('Invalid Request.', {
          siteId: 'site ID is missing',
        }),
      );
    }
    const parsedSiteId = parseInt(siteId as string, 10);
    const data = await siteService.repollData(parsedSiteId, req.user.id);
    return res.send(data);
  } catch (error) {
    return res.status(400).send({ msg: STANDARD_ERROR_MSG });
  }
}
