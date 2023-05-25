import { Injectable } from '@nestjs/common';
import { List } from '../schemas/list.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ListService {
  constructor(
    @InjectModel(List.name) private readonly listModel: Model<List>,
  ) {}

  async findAll(): Promise<List[]> {
    return this.listModel.find({}, {}, { sort: { name: -1 } }).exec();
  }
}
