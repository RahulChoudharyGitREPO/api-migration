import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class Hierarchy {
  @Prop({ required: true })
  id: number;

  @Prop({ default: false })
  checked: boolean;

  @Prop({ required: true })
  inputValue: string;

  @Prop({ required: true })
  color: string;

  @Prop({ default: 'Please enter value' })
  placeholder: string;
}

export const HierarchySchema = SchemaFactory.createForClass(Hierarchy);

@Schema({ timestamps: true, minimize: false, collection: 'frameworks' })
export class Framework extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: [HierarchySchema], default: [] })
  hierarchy: Hierarchy[];

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [], name: 'schema' })
  formSchema: any[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  schemaValues: any;
}

export const FrameworkSchema = SchemaFactory.createForClass(Framework);
