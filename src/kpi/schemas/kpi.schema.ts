import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

// Schema format subdocument (reused from partners/programs modules)
@Schema({ _id: false })
export class SchemaFormat {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  type: string;

  @Prop({ default: null })
  schemaType: string;

  @Prop({ default: null })
  parentId: string;

  @Prop({ default: false })
  required: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  properties: any;
}

export const SchemaFormatSchema = SchemaFactory.createForClass(SchemaFormat);

@Schema({ timestamps: true, minimize: false })
export class Kpi {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  progress: number;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [SchemaFormatSchema], default: [] })
  schema: SchemaFormat[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  schemaValues: any;
}

export const KpiSchema = SchemaFactory.createForClass(Kpi);
