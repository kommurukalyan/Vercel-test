import { IsEmail, IsNotEmpty } from 'class-validator';

export default class LoginRquest {
  @IsNotEmpty()
  @IsEmail()
  readonly email!: string;

  @IsNotEmpty()
  readonly password!: string;
}
