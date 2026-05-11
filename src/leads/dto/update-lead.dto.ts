import { LeadStatus } from "@prisma/client";
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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
