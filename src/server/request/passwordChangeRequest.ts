import { IsNotEmpty, IsString } from 'class-validator';

export default class PasswordChangeRequest {
  @IsNotEmpty()
  @IsString()
  readonly password!: string;

  @IsNotEmpty()
  @IsString()
  readonly newPassword!: string;
}
