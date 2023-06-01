import { Controller, Get } from '@nestjs/common';
import { List } from '../schemas/list.schema';
import { ListService } from './list.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('currency/list')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Get()
  @ApiOperation({ summary: 'Returns currency list.' })
  async findAll(): Promise<List[]> {
    return this.listService.findAll();
  }
}
