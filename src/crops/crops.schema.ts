import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CropDocument = Crop & Document;

@Schema({ timestamps: true, collection: "crops" })
export class Crop {
  @Prop({ required: true })
  name: string;

  @Prop()
  scientificName?: string;

  @Prop()
  description?: string;

  @Prop()
  category?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isRemove: boolean;
}

export const CropSchema = SchemaFactory.createForClass(Crop);