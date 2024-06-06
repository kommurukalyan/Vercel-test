import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';

import logger from '@/server/serverUtils/logger';
import { NextRequestWithUser } from '@/types';
import prisma from '@/lib/prisma';

export interface IJwtUser {
  id: number;
  email: string;
}

/**
 * Checks if a password is valid for a user
 * @param user
 * @param valueToCheck
 */
export async function checkUserPassword(user: User, valueToCheck: string) {
  return bcrypt.compare(valueToCheck, user.password as string);
}

/**
 * Returns the data inserted into the JWT token for user
 * @param user
 */
export async function getJwtDataForUser(user: User): Promise<IJwtUser> {
  return { id: user.id, email: user.email };
}

// /**
//  * Checks the validity of a user token and optionally verifies if the user has the required role.
//  * @async
//  * @param {NextRequestWithUser} request - The incoming request with user information.
//  * @param {Role} [requiredRole] - An optional parameter to specify the required user role.
//  * @returns {Promise<NextResponse | null>} - A Promise that resolves to `null` if the token is valid and the user has the required role (if specified). Otherwise, it returns a NextResponse with an appropriate error message and status code.
//  */
// export async function oldCheckToken(
//   request: NextRequestWithUser,
//   requiredRole?: Role,
// ) {
//   const token = (await getToken({ req: request })) as IJWTWithUser;
//   if (!token) {
//     return { status: 401, msg: 'Please login to complete this request' };
//   }
//   request.user = token.user;

//   // Allow Super-Admin to access all
//   if (token.user.role === Role.SUPER_ADMIN) {
//     return null;
//   }
//   if (requiredRole) {
//     if (requiredRole === Role.AMC_USER) {
//       if (token.user.role === Role.AMC_ADMIN) {
//         return null;
//       }
//       if (token.user.role !== requiredRole) {
//         return {
//           status: 403,
//           msg: 'Unauthorised Access',
//         };
//       }
//     }
//     if (token.user.role !== requiredRole) {
//       return {
//         status: 403,
//         msg: 'Unauthorised Access',
//       };
//     }
//   }
//   return null;
// }

export interface IJWTWithId extends JwtPayload {
  id: number;
  user: {
    id: number;
  };
}

export function isAuthenticated(req: any) {
  const token =
    req.headers.authorization && req.headers.authorization.split(' ')[1];
  try {
    return jwt.verify(token, (process as any).env.NEXTAUTH_SECRET, {
      ignoreExpiration: true,
    });
  } catch (err) {
    logger.log(err, 'error');
    return false;
  }
}
/**
 * Checks the validity of a user token and optionally verifies if the user has the required role.
 * @async
 * @param {NextRequestWithUser} request - The incoming request with user information.
 * @param {Role} [requiredRole] - An optional parameter to specify the required user role.
 * @returns {Promise<NextResponse | null>} - A Promise that resolves to `null` if the token is valid and the user has the required role (if specified). Otherwise, it returns a NextResponse with an appropriate error message and status code.
 */
export async function checkToken(request: NextRequestWithUser) {
  const isLoggedIn = isAuthenticated(request) as IJWTWithId;
  if (!isLoggedIn || !isLoggedIn.id) {
    return { status: 403, msg: 'Please login to complete this request' };
  }
  const { id } = isLoggedIn;

  const userData = await prisma.user.findUnique({
    where: { id },
  });

  if (!userData) {
    return { status: 401, msg: 'Please login again to proceed' };
  }

  request.user = userData;

  return null;
}
