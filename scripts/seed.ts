/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

function hashPassword(val: string) {
  return bcrypt.hash(val, 10);
}

const prisma = new PrismaClient();

const users: Prisma.UserCreateInput[] = [
  {
    email: 'admin@ionixsystems.com',
    name: 'SuperAdmin',
    password: 'test',
  },
  {
    email: 'user@ionixsystems.com',
    name: 'User',
    password: 'test123',
  },
];

/**
 * The Prisma main seed function
 */
async function main() {
  console.log('Start seeding ...');
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: users[0].email }, { email: users[1].email }] },
  });
  if (!existingUser) {
    console.log('Skipping user insert');
    for (const u of users) {
      u.password = await hashPassword(u.password as string);
      const user = await prisma.user.create({
        data: u,
      });
      console.log(`Created user id: ${user.id}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
