import { NextApiRequest } from 'next';

export interface NextRequestWithUser extends NextApiRequest {
  user: any;
}

export interface ITableColumnType {
  key: string;
  label: string | JSX.Element;
  prospectFormattter?: (value?: any) => any;
}
