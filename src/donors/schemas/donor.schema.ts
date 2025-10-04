import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Donor {
  @Prop({ required: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  email: string;

  @Prop()
  mobile: string;

  @Prop()
  state: string;

  @Prop()
  district: string;

  @Prop()
  gstNo: string;

  @Prop()
  address: string;

  @Prop({ required: true })
  basePath: string;

  @Prop({ default: process.env.NODE_ENV === 'production' ? 'https://service.leafledger.in' : 'https://devservice.leafledger.in' })
  apiPath: string;

  @Prop({ default: process.env.NODE_ENV === 'production' ? 'https://app.leafledger.in' : 'https://dev.leafledger.in' })
  clientUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users' })
  updatedBy: Types.ObjectId;

  @Prop({
    type: {
      dashboard: { type: [String], default: [] },
      reports: { type: [String], default: [] },
    },
    default: { dashboard: [], reports: [] },
  })
  features: {
    dashboard: string[];
    reports: string[];
  };
}

export const DonorSchema = SchemaFactory.createForClass(Donor);

// Pre-save middleware to uppercase code
DonorSchema.pre('save', function (next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Pre-update middleware to uppercase code
DonorSchema.pre('findOneAndUpdate', function (next) {
  const update: any = this.getUpdate();
  if (update.code) {
    update.code = update.code.toUpperCase();
  }
  next();
});
