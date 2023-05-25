import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ListDocument = HydratedDocument<List>;

@Schema()
export class List {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  sign: string;
}

export const ListSchema = SchemaFactory.createForClass(List);
