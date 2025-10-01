import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true, collection: "companies" })
export class Company {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isRemove: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);