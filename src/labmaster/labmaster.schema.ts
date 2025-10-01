import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type LabMasterDocument = LabMaster & Document;

@Schema({ timestamps: true, collection: "labmasters" })
export class LabMaster {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  address?: string;

  @Prop()
  contactNumber?: string;

  @Prop()
  email?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isRemove: boolean;
}

export const LabMasterSchema = SchemaFactory.createForClass(LabMaster);
