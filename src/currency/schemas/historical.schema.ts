import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type HistoricalDocument = HydratedDocument<Historical>;

@Schema()
export class Historical {
  @Prop({ required: true })
  date: string;

  @Prop()
  data: mongoose.Schema.Types.Mixed;
}

export const HistoricalSchema = SchemaFactory.createForClass(Historical);
