import { IsUUID } from 'class-validator';

export class LinkComponentItemDto {
  @IsUUID('4')
  itemId: string;
}
