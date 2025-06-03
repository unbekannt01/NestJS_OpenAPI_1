import { IsEmail, IsNotEmpty } from "class-validator";

/**
 * ForgotPwdDto
 * This class is used to define the data transfer object for the forgot password request.
 * It includes validation rules for each property.
 */
export class ResetPwdDto {

    @IsEmail()
    email : string;

    @IsNotEmpty()
    newpwd : string;
}
