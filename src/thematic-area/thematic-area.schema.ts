import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true, minimize: false, collection: 'thematicareas' })
export class ThematicArea extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [], name: 'schema' })
  formSchema: any[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  schemaValues: any;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'users', required: true })
  createdBy: Types.ObjectId;
}

export const ThematicAreaSchema = SchemaFactory.createForClass(ThematicArea);
