export class LoggedInUserModel {
  id?: number;
  userName: string = '';
  email: string = '';
  userType?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  createdAt?: string;
  updatedAt?: string;
  roles?: string[];
  verified?: boolean;
}
