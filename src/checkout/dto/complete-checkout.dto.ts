import { IsEmail, IsString, MinLength } from "class-validator";

export class CompleteCheckoutDto {
  @IsString()
  @MinLength(10)
  paymentIntentId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;
}
