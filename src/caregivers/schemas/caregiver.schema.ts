import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class Education {
  @Prop({ trim: true })
  highestEducation: string;

  @Prop({ trim: true })
  subjectExpertise: string;

  @Prop({ trim: true })
  institutionName: string;

  @Prop({ type: [String], default: [] })
  languagesKnown: string[];
}

const EducationSchema = SchemaFactory.createForClass(Education);

@Schema({ _id: false })
export class WorkExperience {
  @Prop({ trim: true })
  jobTitle: string;

  @Prop({ trim: true })
  organisationName: string;

  @Prop()
  fromDate: Date;

  @Prop()
  toDate: Date;
}

const WorkExperienceSchema = SchemaFactory.createForClass(WorkExperience);

@Schema({ _id: false })
export class Documents {
  @Prop()
  resumeCvUrl: string;

  @Prop({ type: [String], default: [] })
  certificateUrls: string[];

  @Prop()
  photoUrl: string;
}

const DocumentsSchema = SchemaFactory.createForClass(Documents);

@Schema({ timestamps: true })
export class Caregiver {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ enum: ['Male', 'Female', 'Other'], required: true })
  gender: string;

  @Prop({ required: true, unique: true })
  phoneNumber: number;

  @Prop({ trim: true, required: true })
  address: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'professions', required: false })
  profession: MongooseSchema.Types.ObjectId;

  @Prop({ type: [EducationSchema], default: [] })
  educationDetails: Education[];

  @Prop({ type: [WorkExperienceSchema], default: [] })
  workExperience: WorkExperience[];

  @Prop({ type: DocumentsSchema, default: {} })
  documents: Documents;
}

export const CaregiverSchema = SchemaFactory.createForClass(Caregiver);
