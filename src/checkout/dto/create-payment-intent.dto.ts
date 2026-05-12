import { IsEmail, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class CreatePaymentIntentDto {
  @IsInt()
  @Min(50)
  @Max(99999999)
  amount!: number;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  clientSlug?: string;

  @IsOptional()
  @IsString()
  planKey?: string;
}
