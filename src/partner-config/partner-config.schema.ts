import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'partnerconfigurations' })
export class PartnerConfig extends Document {
  @Prop({ type: [String], default: [] })
  staticFields: string[];

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [], name: 'schema' })
  formSchema: any[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  schemaValues: any;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'users', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'users', required: true })
  updatedBy: Types.ObjectId;
}

export const PartnerConfigSchema = SchemaFactory.createForClass(PartnerConfig);
