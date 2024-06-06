/* eslint-disable import/no-anonymous-default-export */
import {
  SendEmailCommand,
  SendEmailRequest,
  SendTemplatedEmailCommand,
  SESClient,
} from '@aws-sdk/client-ses';
import * as aws from '@aws-sdk/client-ses';
import nodemailer, { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SESTransport from 'nodemailer/lib/ses-transport';

import Logger from '@/server/serverUtils/logger';

class AwsEmailClient {
  EmailClient!: SESClient;
  Transporter!: Transporter<SESTransport.SentMessageInfo>;

  constructor() {
    this.initialize();
  }

  initialize = () => {
    this.EmailClient = new SESClient();
    this.Transporter = nodemailer.createTransport({
      SES: { ses: this.EmailClient, aws },
    });
  };

  formatMailObject = (
    toEmails: string[],
    subject: string,
    bodyPlainText: string,
    bodyHTML?: string,
  ): Omit<SendEmailRequest, 'Source'> => {
    const inputObject: Omit<SendEmailRequest, 'Source'> = {
      Destination: {
        ToAddresses: toEmails,
      },
      Message: {
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: bodyPlainText,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
    };
    if (inputObject.Message?.Body && bodyHTML) {
      inputObject.Message.Body.Html = {
        Charset: 'UTF-8',
        Data: bodyHTML,
      };
    }
    return inputObject;
  };

  sendEmail = async (payload: Omit<SendEmailRequest, 'Source'>) => {
    const command = new SendEmailCommand({
      Source: `${process.env.SES_FROM_EMAIL}`,
      ...payload,
    });

    try {
      await this.EmailClient.send(command);
    } catch (e) {
      Logger.log(e, 'error');
    }
  };

  sendMailUsingMailer = async (mailData: Mail.Options) => {
    try {
      // if (process.env.APP_ENV === 'local') {
      //   return "local";
      // }
     const res= await this.Transporter.sendMail({
        from: `${process.env.SES_FROM_EMAIL}`,
        ...mailData,
      });
      return res;
    } catch (error) {
    Logger.log(error, 'error');
    }
  };

  public async sendTemplatedEmail(
    to: string,
    templateName: string,
    data: string,
  ): Promise<void> {
    const website = process.env.INSPECT_WEBSITE;
    const s3URL = process.env.S3_URL;
    const contactEmail = process.env.INSPECT_CONTACT_MAIL;
    const jsonObj = JSON.parse(data);
    jsonObj['website'] = website;
    jsonObj['s3URL'] = s3URL;
    jsonObj['curYear'] = new Date().getFullYear();
    jsonObj['contactEmail'] = contactEmail;

    const formattedData = JSON.stringify(jsonObj);

    const sender = process.env.SES_FROM_EMAIL;
    const sendEmailCommand = new SendTemplatedEmailCommand({
      Source: sender,
      Destination: {
        ToAddresses: [to],
      },
      Template: templateName,
      TemplateData: formattedData,
    });
    await this.EmailClient.send(sendEmailCommand);
  }
}

export default new AwsEmailClient();
