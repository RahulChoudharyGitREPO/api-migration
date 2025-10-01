import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type EntityDocument = Entity & Document;

@Schema({ timestamps: true, collection: "entities" })
export class Entity {
  @Prop({ required: true, unique: true })
  entityCode: number;

  @Prop({ required: true })
  dbUrl: string;

  @Prop({ required: true, unique: true })
  basePath: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: "https://service.tracseed.com" })
  serviceUrl: string;

  @Prop()
  info?: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: number;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  state: string;

  @Prop()
  gst?: string;

  @Prop({ required: true })
  adminEmail: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  deleted: boolean;

  @Prop({ type: [{ name: String, isFree: { type: Boolean, default: true }, active: { type: Boolean, default: true } }] })
  features?: Array<{ name: string; isFree: boolean; active: boolean }>;
}

export const EntitySchema = SchemaFactory.createForClass(Entity);