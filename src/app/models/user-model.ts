export class UserModel {
	userName: string = '';
	password: string = '';
	email: string = '';
	mobileNumber: string = '';
	countryCode: string = '';
	firstName: string = '';
	lastName: string = '';
	gender: string = '';
	roleName: string = '';
	// Additional fields from signup form
	dateOfBirth?: string;
	isVerified?: boolean;
}
