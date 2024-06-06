import { IsNotEmpty } from 'class-validator';

export default class AddSiteRequest {
  @IsNotEmpty()
  readonly siteId!: string;

  @IsNotEmpty()
  readonly locationUuid!: string;

  @IsNotEmpty()
  readonly locationName!: string;

  @IsNotEmpty()
  readonly apiKey!: string;
}
