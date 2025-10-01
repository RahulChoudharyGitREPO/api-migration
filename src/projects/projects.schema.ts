import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true, collection: "projects" })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  status?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isRemove: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);