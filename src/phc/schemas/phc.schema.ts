import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Location {
  @Prop({ trim: true })
  state: string;

  @Prop({ trim: true })
  district: string;

  @Prop({ trim: true })
  taluk: string;

  @Prop({ trim: true })
  panchayat: string;

  @Prop({ trim: true })
  village: string;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

@Schema({ timestamps: true, versionKey: false })
export class Phc {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: LocationSchema, default: {} })
  location: Location;

  @Prop({ default: true })
  isActive: boolean;
}

export const PhcSchema = SchemaFactory.createForClass(Phc);

// Create indexes
PhcSchema.index({ 'location.state': 1 });
PhcSchema.index({ 'location.district': 1 });
PhcSchema.index({ 'location.taluk': 1 });
PhcSchema.index({ 'location.panchayat': 1 });
