import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, unique: true, trim: true })
  projectId: string;

  @Prop({ required: true, unique: true, trim: true })
  projectName: string;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  projectManager: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'],
  })
  mobileNumber: string;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop()
  projectCategory: string;

  @Prop()
  tagOne: string;

  @Prop()
  tagTwo: string;

  @Prop()
  tagThree: string;

  @Prop()
  additionalInfo: string;

  @Prop({ default: true })
  status: boolean;

  @Prop({
    type: {
      value: { type: Number },
      unit: { type: String, enum: ['days', 'weeks', 'months', 'years'] },
    },
  })
  duration: {
    value: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
  };

  @Prop({ type: Types.ObjectId, ref: 'users' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users' })
  updatedBy: Types.ObjectId;

  @Prop([{ type: Types.ObjectId, ref: 'Form' }])
  forms: Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Pre-save middleware
ProjectSchema.pre('save', async function (next) {
  try {
    const forms = this?.forms || [];

    if (forms.length > 0) {
      const Forms = this.db.model('Form');

      const bulkOps = forms.map((id) => ({
        updateOne: {
          filter: { _id: id, projects: { $ne: this._id } },
          update: { $push: { projects: this._id } },
        },
      }));

      if (bulkOps.length > 0) {
        await Forms.bulkWrite(bulkOps);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update middleware
ProjectSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const projectBeforeUpdate = await this.model
      .findOne(this.getQuery())
      .select('forms');

    const updateData: any = this.getUpdate();
    const formsBefore = projectBeforeUpdate?.forms || [];
    const formsAfter = updateData?.forms || [];

    const formsToAdd = formsAfter.filter(
      (id: any) =>
        !formsBefore.some(
          (existingId: any) => existingId.toString() === id.toString()
        )
    );

    const formsToRemove = formsBefore.filter(
      (id: any) =>
        !formsAfter.some(
          (updatedId: any) => updatedId.toString() === id.toString()
        )
    );

    const Forms = this.model.db.model('Form');
    const query: any = this.getQuery();
    const update: any = this.getUpdate();
    const projectId = query._id || update._id;

    const bulkOps: any[] = [];

    if (formsToAdd.length > 0) {
      formsToAdd.forEach((formId: any) => {
        bulkOps.push({
          updateOne: {
            filter: { _id: formId, projects: { $ne: projectId } },
            update: { $push: { projects: projectId } },
          },
        });
      });
    }

    if (formsToRemove.length > 0) {
      formsToRemove.forEach((formId: any) => {
        bulkOps.push({
          updateOne: {
            filter: { _id: formId, projects: projectId },
            update: { $pull: { projects: projectId } },
          },
        });
      });
    }

    if (bulkOps.length > 0) {
      await Forms.bulkWrite(bulkOps);
    }

    next();
  } catch (error) {
    next(error);
  }
});