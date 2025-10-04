import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

// Schema format subdocument (reused from partners module)
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
export class Program {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  budget: number;

  @Prop({ required: true })
  budgetUtilisation: number;

  @Prop({ required: true })
  thematicAreas: string;

  @Prop({ required: true })
  partnerName: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: [SchemaFormatSchema], default: [] })
  schema: SchemaFormat[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  schemaValues: any;

  @Prop({ type: Types.ObjectId, ref: 'kpis' })
  kpi: Types.ObjectId;
}

export const ProgramSchema = SchemaFactory.createForClass(Program);
