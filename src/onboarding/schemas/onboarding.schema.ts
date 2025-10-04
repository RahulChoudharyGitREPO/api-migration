import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class Address {
  @Prop({ trim: true })
  houseNo: string;

  @Prop({ trim: true })
  streetName: string;

  @Prop({ trim: true })
  location: string;

  @Prop({ trim: true })
  village: string;

  @Prop({ trim: true })
  phc: string;

  @Prop({ trim: true })
  taluk: string;

  @Prop({ trim: true })
  district: string;

  @Prop({ trim: true })
  state: string;

  @Prop({ trim: true })
  postCode: string;
}

const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ _id: false })
export class Coordinates {
  @Prop()
  latitude: number;

  @Prop()
  longitude: number;
}

const CoordinatesSchema = SchemaFactory.createForClass(Coordinates);

@Schema({ timestamps: true })
export class Onboarding {
  @Prop({ trim: true })
  slNo: string;

  @Prop()
  date: Date;

  @Prop({ trim: true })
  chwID: string;

  @Prop({ trim: true })
  referredBy: string;

  @Prop({ trim: true })
  primaryCarer: string;

  @Prop({ trim: true })
  phoneNumber: string;

  @Prop({ trim: true })
  name: string;

  @Prop()
  age: number;

  @Prop({ enum: ['Male', 'Female', 'Other'] })
  gender: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'users', required: true })
  recordedBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'users' })
  updatedBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: AddressSchema, default: {} })
  address: Address;

  @Prop({ type: CoordinatesSchema, default: {} })
  coordinates: Coordinates;

  @Prop({
    enum: [
      'Normal activity levels, no limitation',
      'Able to walk + light work possible',
      'Able to walk and self-care, but no work possible',
      'Limited self-care; mostly bound to a chair or bed',
      'Completely disabled, no self care possible',
    ],
  })
  performanceStatus: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  symptoms: {
    pain?: string;
    shortnessOfBreath?: string;
    weakness?: string;
    nausea?: string;
    vomiting?: string;
    poorAppetite?: string;
    constipation?: string;
    soreOrDryMouth?: string;
    incontinence?: string;
    looseStools?: string;
    swellingAbdomen?: string;
    swellingOtherSite?: string;
    itching?: string;
    difficultSwallow?: string;
  };

  @Prop({ enum: ['Easy', 'Occasional', 'Withdrawn', 'Non-Communicative'] })
  communication: string;

  @Prop({ enum: ['Normal', 'Agitated', 'Anxious', 'Depressed'] })
  mood: string;

  @Prop({
    enum: [
      'Good - no concerns',
      'Needs regular follow up',
      'Serious - burnout',
      'Critical - Risk of self harm',
    ],
  })
  caregiverBurden: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  nursingIssues: {
    pressureSores?: boolean;
    gradePressureSores?: string;
    tracheostomyCare?: boolean;
    stomaCare?: boolean;
    ivCannula?: boolean;
    ngPegTube?: boolean;
    oxygenSupport?: boolean;
    bleeding?: boolean;
    foulSmell?: boolean;
    lymphedema?: boolean;
    urinaryCatheter?: boolean;
    hearingAid?: boolean;
    walkingAid?: boolean;
    unableToDetermine?: boolean;
  };

  @Prop({ type: [String] })
  medicalIssues: string[];

  @Prop({
    enum: [
      'Service delivered',
      'Eligible, but service not delivered',
      'Not eligible',
    ],
  })
  eligibility: string;
}

export const OnboardingSchema = SchemaFactory.createForClass(Onboarding);
