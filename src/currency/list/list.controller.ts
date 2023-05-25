import { Controller, Get } from '@nestjs/common';
import { List } from '../schemas/list.schema';
import { ListService } from './list.service';

@Controller('currency/list')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Get()
  async findAll(): Promise<List[]> {
    return this.listService.findAll();
  }
}
