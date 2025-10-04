import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Condition {
  @Prop({ required: true })
  field: string;

  @Prop({
    required: true,
    enum: ['=', '>', '<', '>=', '<=', '!=']
  })
  operation: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.Mixed
  })
  value: any;
}

export const ConditionSchema = SchemaFactory.createForClass(Condition);

@Schema({ timestamps: true })
export class Step {
  @Prop({
    required: true,
    enum: ['email', 'whatsapp', 'notification']
  })
  action: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: []
  })
  users: Types.ObjectId[];

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  notifyCreator: boolean;

  @Prop({
    type: {
      email: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
    },
    default: { email: false, whatsapp: false }
  })
  notifyChannels: {
    email: boolean;
    whatsapp: boolean;
  };

  @Prop({ type: [ConditionSchema], default: [] })
  triggers: Condition[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  creatorMessage: any;

  @Prop({ type: [String], default: [] })
  selectedFields: string[];
}

export const StepSchema = SchemaFactory.createForClass(Step);

@Schema({ timestamps: true })
export class Workflow {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [ConditionSchema], default: [] })
  triggers: Condition[];

  @Prop({
    enum: ['AND', 'OR'],
    default: 'AND'
  })
  logicOperator: string;

  @Prop({ type: [StepSchema], default: [] })
  steps: Step[];
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);

@Schema({ timestamps: true })
export class LayoutSelection {
  @Prop({
    default: 'vertical',
    enum: ['vertical', 'horizontal']
  })
  layout: string;

  @Prop({ type: Array, default: [] })
  fields: any[];
}

export const LayoutSelectionSchema = SchemaFactory.createForClass(LayoutSelection);

@Schema({ timestamps: true })
export class SharedWith {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ default: false })
  canCreate: boolean;

  @Prop({ default: false })
  canEdit: boolean;
}

export const SharedWithSchema = SchemaFactory.createForClass(SharedWith);

@Schema({ timestamps: true })
export class Form extends Document {
  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  title: string;

  @Prop({ type: Array, default: [], name: 'schema' })
  formSchema: any[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  columnsPerPage: any;

  @Prop({ default: 'active' })
  status: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: []
  })
  favorite: Types.ObjectId[];

  @Prop({ type: [SharedWithSchema], default: [] })
  sharedWith: SharedWith[];

  @Prop({ type: [LayoutSelectionSchema], default: [] })
  layoutSelections: LayoutSelection[];

  @Prop({ default: false })
  published: boolean;

  @Prop({ default: false })
  isDraft: boolean;

  @Prop({ type: [WorkflowSchema], default: [] })
  workflows: Workflow[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Project' }],
    default: []
  })
  projects: Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  _properties: any;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const FormSchema = SchemaFactory.createForClass(Form);