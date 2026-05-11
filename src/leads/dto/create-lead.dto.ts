import { LeadStatus } from "@prisma/client";
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateLeadDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsNumber()
  revenue?: number;
}
