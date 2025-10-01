import { Schema, Document } from "mongoose";
import { Types } from "mongoose";

export interface Education {
  highestEducation?: string;
  subjectExpertise?: string;
  institutionName?: string;
  languagesKnown?: string[];
}

export interface WorkExperience {
  jobTitle?: string;
  organisationName?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface Caregiver extends Document {
  fullName: string;
  dateOfBirth: Date;
  isActive: boolean;
  email: string;
  gender: "Male" | "Female" | "Other";
  phoneNumber: number;
  address: string;
  profession?: Types.ObjectId;
  education?: Education[];
  workExperience?: WorkExperience[];
  createdAt: Date;
  updatedAt: Date;
}

const EducationSchema = new Schema({
  highestEducation: {
    type: String,
    trim: true,
  },
  subjectExpertise: {
    type: String,
    trim: true,
  },
  institutionName: {
    type: String,
    trim: true,
  },
  languagesKnown: {
    type: [String],
    default: [],
  },
});

const WorkExperienceSchema = new Schema({
  jobTitle: {
    type: String,
    trim: true,
  },
  organisationName: {
    type: String,
    trim: true,
  },
  fromDate: {
    type: Date,
  },
  toDate: {
    type: Date,
  },
});

export const CaregiverSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      trim: true,
      required: true,
    },
    profession: {
      type: Schema.Types.ObjectId,
      ref: "professions",
      required: false,
    },
    education: [EducationSchema],
    workExperience: [WorkExperienceSchema],
  },
  {
    timestamps: true,
    collection: "caregivers",
  },
);
