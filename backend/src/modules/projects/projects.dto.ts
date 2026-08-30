import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ProjectHealth, ProjectStage, Priority } from '../../common/enums';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsUUID('4')
  @IsNotEmpty()
  customerId: string;

  @IsUUID('4')
  @IsNotEmpty()
  projectManagerId: string;

  @IsUUID('4')
  @IsOptional()
  opportunityId?: string;

  @IsUUID('4')
  @IsOptional()
  sourceQuoteId?: string;

  @IsEnum(ProjectStage)
  @IsOptional()
  stage?: ProjectStage;

  @IsEnum(ProjectHealth)
  @IsOptional()
  health?: ProjectHealth;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsDateString()
  @IsOptional()
  targetDeliveryDate?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  teamMembers?: string[];
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsUUID('4')
  @IsOptional()
  customerId?: string;

  @IsUUID('4')
  @IsOptional()
  projectManagerId?: string;

  @IsEnum(ProjectStage)
  @IsOptional()
  stage?: ProjectStage;

  @IsEnum(ProjectHealth)
  @IsOptional()
  health?: ProjectHealth;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsDateString()
  @IsOptional()
  targetDeliveryDate?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  teamMembers?: string[];
}

export class UpdateKickoffDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  attendees?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  agendaItems?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  decisions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  actionItems?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  risks?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class AddMilestoneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsDateString()
  @IsOptional()
  actualDate?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
