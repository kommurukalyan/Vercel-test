import dotenv from 'dotenv';
dotenv.config();

const {
  NODE_ENV,
  PORT,
  APP_ENV,
  APP_ID,
  JWT_SECRET,
  JWT_ACCESS_EXPIRATION_DAYS,
  ENCRYPTION_APPSECRET,
  USER_EMAIL,
  USER_PASSWORD,
  API_ACCESS_KEY,
  API_ACCESS_SECRET,
  SECRET_IV,
  ENCRYPTION_METHOD
} = process.env;
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  nodeenv: NODE_ENV,
  port: PORT,
  appenv: APP_ENV,
  appId: APP_ID,
  jwtSecret: JWT_SECRET,
  jwtExpiration: JWT_ACCESS_EXPIRATION_DAYS,
  encryptionSecret: ENCRYPTION_APPSECRET,
  userEmail: USER_EMAIL,
  userPassword: USER_PASSWORD,
  apiAccessKey: API_ACCESS_KEY,
  apiAccessSecret: API_ACCESS_SECRET,
  secretIv:SECRET_IV,
  encryptionMethod:ENCRYPTION_METHOD
};
