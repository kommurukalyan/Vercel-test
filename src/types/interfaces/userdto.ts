export interface IUserDTO {
  id: number;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  forceChangePassword: boolean;
}
