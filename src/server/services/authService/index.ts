import { User } from '@prisma/client';

import LoginRquest from '@/server/request/loginRquest';
import {
  getErrorResponse,
  getSuccessResponse,
  hashPassword,
  validatePassword,
} from '@/server/serverUtils/helpers';
import logger from '@/server/serverUtils/logger';
import { generateToken } from '@/server/serverUtils/shared';
import prisma from '@/lib/prisma';
import PasswordChangeRequest from '@/server/request/passwordChangeRequest';

export default class AuthService {
  public static userprofileToDTO = (user: User) => {
    const adminDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    return adminDTO;
  };
  public static login = async (payload: LoginRquest) => {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { email: payload.email },
      });
      if (!currentUser) {
        return getErrorResponse('Invalid email or password. Please try again!');
      }

      const isPassowrdValid = await validatePassword(
        currentUser,
        payload.password,
      );

      if (!isPassowrdValid) {
        return getErrorResponse('Invalid email or password. Please try again!');
      }

      const userDto = this.userprofileToDTO(currentUser);
      return getSuccessResponse('Login successful', {
        token: generateToken(currentUser),
        user: userDto,
        forceChangePassword: !currentUser.emailVerified,
      });
    } catch (error) {
      logger.log(error, undefined, 'error');
      return getErrorResponse();
    }
  };

  public static updatePassword = async (
    userId: number,
    payload: PasswordChangeRequest,
  ) => {
    try {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      const isValidPassword = await validatePassword(user, payload.password);
      if (!isValidPassword) {
        return getErrorResponse('Invalid password');
      }
      const encryptedPassword = await hashPassword(payload.newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: encryptedPassword },
      });

      return getSuccessResponse('Password updated successfully');
    } catch (error) {
      logger.log(error, 'error');
      return getErrorResponse();
    }
  };
}
