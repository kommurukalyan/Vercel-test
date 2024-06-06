import { User } from '@prisma/client';

import prisma from '@/lib/prisma';

export default class UserService {
  public static getUserById = async (userId: number): Promise<User> => {
    const userData = await prisma.user.findUnique({ where: { id: userId } });
    return userData as User;
  };
}
