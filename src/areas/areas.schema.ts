import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type AreaDocument = Area & Document;

@Schema({ timestamps: true, collection: "areas" })
export class Area {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  district?: string;

  @Prop()
  state?: string;

  @Prop()
  pincode?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isRemove: boolean;
}

export const AreaSchema = SchemaFactory.createForClass(Area);
