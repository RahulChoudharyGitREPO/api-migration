import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false })
  password: string;

  @Prop({ required: true })
  mobile: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    required: true,
    enum: ["SuperAdmin", "ProjectAdmin", "FieldOfficer"],
  })
  role: string;

  @Prop({ default: "" })
  profilePic: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: "Crop" }] })
  species: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: "Company" }] })
  companies: Types.ObjectId[];

  @Prop({ default: "" })
  addressLine1: string;

  @Prop({ default: "" })
  addressLine2: string;

  @Prop({ default: false })
  isRemove: boolean;

  @Prop({ unique: true })
  passwordHash: string;

  @Prop({ type: Types.ObjectId, ref: "LabMaster" })
  labMaster: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: "Entity" }] })
  entities: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: "Project" }] })
  projects: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: "users" })
  projectManager: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
