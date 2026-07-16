import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateIssueDto {
  @IsString()
  @MaxLength(500, { message: 'Максимум 500 символов' })
  title: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  block?: string;
}

export class UpdateIssueDto {
  @IsString()
  status: string;
}
