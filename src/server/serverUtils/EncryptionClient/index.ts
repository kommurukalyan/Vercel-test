import crypto from 'crypto';

import config from '@/server/serverUtils/config';

class EncryptionClient {
  KEY!: string;
  ENCRYPTIONIV!: string;
  constructor() {
    this.initialize();
  }

  initialize = () => {
    this.KEY = crypto
      .createHash('sha512')
      .update(config.encryptionSecret as string)
      .digest('hex')
      .substring(0, 32);
    this.ENCRYPTIONIV = crypto
      .createHash('sha512')
      .update(config.encryptionSecret as string)
      .digest('hex')
      .substring(0, 16);
  };

  encryptData = (data: string) => {
    if (
      !config.encryptionSecret ||
      !config.secretIv ||
      !config.encryptionMethod
    ) {
      throw new Error('secretKey, secretIV, and encryptionMethod are required');
    }
    const cipher = crypto.createCipheriv(
      config.encryptionMethod as string,
      this.KEY,
      this.ENCRYPTIONIV,
    );

    return Buffer.from(
      cipher.update(data, 'utf8', 'hex') + cipher.final('hex'),
    ).toString('base64'); // Encrypts data and converts to hex and base64
  };

  decryptData = (encryptedData: string) => {
    if (
      !config.encryptionSecret ||
      !config.secretIv ||
      !config.encryptionMethod
    ) {
      throw new Error('secretKey, secretIV, and encryptionMethod are required');
    }
    const buff = Buffer.from(encryptedData, 'base64');
    const decipher = crypto.createDecipheriv(
      config.encryptionMethod as string,
      this.KEY,
      this.ENCRYPTIONIV,
    );
    return (
      decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
      decipher.final('utf8')
    ); // Decrypts data and converts to utf8
  };
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new EncryptionClient();
