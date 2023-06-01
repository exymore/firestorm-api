import { ApiProperty } from '@nestjs/swagger';

export class UpdateLatestRatesDto {
  @ApiProperty()
  key: string;
}
