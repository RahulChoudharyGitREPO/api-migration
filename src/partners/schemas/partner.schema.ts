import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

// Schema format subdocument (shared across partner, program, kpi)
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
export class Partner {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  partnerCode: number;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  contactNumber: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  status: string;

  @Prop({ type: [SchemaFormatSchema], default: [] })
  schema: SchemaFormat[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  schemaValues: any;
}

export const PartnerSchema = SchemaFactory.createForClass(Partner);
