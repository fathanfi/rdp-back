import { IsString, MinLength } from "class-validator";

export class RedeemCodeDto {
  @IsString()
  @MinLength(16)
  code!: string;
}
