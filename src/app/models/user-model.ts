export class UserModel {
	userName: string = '';
	password: string = '';
	email: string = '';
	mobileNumber: string = '';
	mobileCountryCode: string = '';
	countryCode: string = '';
	firstName: string = '';
	lastName: string = '';
	gender: string = '';
	roleName: string = '';
	dateOfBirth?: string;
	isVerified?: boolean;
	verificationSessionId?: string;
}
