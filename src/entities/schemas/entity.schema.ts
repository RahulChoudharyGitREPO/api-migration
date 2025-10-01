import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Features {
  @Prop({ required: true })
  name: string;

  @Prop({ default: true })
  isFree: boolean;

  @Prop({ default: true })
  active: boolean;
}

export const FeaturesSchema = SchemaFactory.createForClass(Features);

@Schema({ timestamps: true })
export class Entity extends Document {
  @Prop({ required: true, unique: true })
  entityCode: number;

  @Prop({ required: true })
  dbUrl: string;

  @Prop({
    required: true,
    unique: true,
    validate: {
      validator: function (value: string) {
        return /^\/[a-z0-9-]{3,}$/.test(value);
      },
      message:
        "Path name is not a valid basePath! It must start with a forward slash (/) and be at least 4 characters long, containing only lowercase letters, numbers, and hyphens (-).",
    },
  })
  basePath: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: "https://service.tracseed.com" })
  serviceUrl: string;

  @Prop()
  info: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: number;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  state: string;

  @Prop()
  gst: string;

  @Prop({ required: true })
  adminEmail: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  deleted: boolean;

  @Prop({ type: [FeaturesSchema], default: [] })
  features: Features[];
}

export const EntitySchema = SchemaFactory.createForClass(Entity);
