import { Injectable } from '@nestjs/common';
import { Connection, Model, Schema as MongooseSchema } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Form } from './schemas/form.schema';

@Injectable()
export class FormProcessorService {

  private getType(type: string): any {
    switch (type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'select':
      case 'radio':
      case 'Input':
      case 'RadioGroup':
        return String;
      case 'number':
        return Number;
      case 'checkbox':
        return Boolean;
      case 'multi-select':
        return [String];
      case 'CheckboxGroup':
        return MongooseSchema.Types.Mixed;
      case 'geoTag':
        return {
          latitude: { type: Number, default: null },
          longitude: { type: Number, default: null },
        };
      default:
        return String;
    }
  }

  createDynamicSchema(schemaDefinition: any[], dbConnection: Connection, slug: string): MongooseSchema {
    const fields: any = {};
    const processedKeys = new Set();

    let serialNumberFieldKey: string | undefined;
    let serialConfig: any = null;

    // Flatten schema if it comes in pages
    const allElements = schemaDefinition.flatMap((page: any) => page.elements || []);

    for (const element of allElements) {
      if (!element.properties) continue;

      const label = element.properties.label;
      if (!label) continue;

      const fieldKey = this.sanitize(label);
      if (processedKeys.has(fieldKey)) continue;

      processedKeys.add(fieldKey);

      // Handle serial number fields
      if (element.type === 'SerialNumber') {
        serialNumberFieldKey = fieldKey;
        serialConfig = element.properties.serialConfig || {};
        fields[fieldKey] = {
          type: String,
          default: '',
        };
        continue;
      }

      // Handle History fields
      if (element.type === 'History') {
        fields[fieldKey] = [MongooseSchema.Types.ObjectId];
        continue;
      }

      // Regular fields
      const fieldType = this.getType(element.type);
      const isRequired = element.required || element.properties.required || false;

      fields[fieldKey] = {
        type: fieldType,
        required: isRequired,
        default: element.properties.defaultValue || undefined,
      };
    }

    // Add metadata fields
    fields.createdAt = { type: Date, default: Date.now };
    fields.updatedAt = { type: Date, default: Date.now };
    fields.createdBy = { type: MongooseSchema.Types.ObjectId, ref: 'User' };
    fields.isDraft = { type: Boolean, default: false };
    fields.workFlowSteps = { type: Array, default: [] };

    const schema = new MongooseSchema(fields, { timestamps: true });

    // Add serial number pre-save hook
    if (serialNumberFieldKey && serialConfig) {
      this.addSerialNumberHook(schema, serialNumberFieldKey, serialConfig, slug, dbConnection);
    }

    return schema;
  }

  private addSerialNumberHook(
    schema: MongooseSchema,
    fieldKey: string,
    config: any,
    slug: string,
    dbConnection: Connection
  ): void {
    schema.pre('save', async function (next) {
      if (this.isNew && !this[fieldKey]) {
        try {
          const collection = dbConnection.collection(`${slug}_counters`);
          const counter = await collection.findOneAndUpdate(
            { _id: fieldKey as any },
            { $inc: { sequence_value: 1 } },
            { upsert: true, returnDocument: 'after' }
          );

          let serialValue = counter?.value?.sequence_value?.toString() || '1';

          if (config.padZeros && config.length) {
            serialValue = serialValue.padStart(config.length, '0');
          }

          if (config.prefix || config.suffix) {
            serialValue = (config.prefix || '') + serialValue + (config.suffix || '');
          }

          this[fieldKey] = serialValue;
        } catch (error) {
          return next(error);
        }
      }
      next();
    });
  }

  async processFormData(params: {
    dbConnection: Connection;
    slug: string;
    projectName?: string;
    rawData: any;
    isDraft: boolean;
    loggedInUserId: string;
    entryId?: string | undefined;
    stepNo?: number;
    approvalStatus?: string;
  }): Promise<any> {
    const {
      dbConnection,
      slug,
      projectName,
      rawData,
      isDraft,
      loggedInUserId,
      entryId,
      stepNo = 0,
      approvalStatus = '',
    } = params;

    // 1. Load form schema
    this.registerSchemas(dbConnection);
    const FormModel = dbConnection.model<Form>('Form', require('./schemas/form.schema').FormSchema);
    const meta = await FormModel.findOne({ slug });
    if (!meta) throw new Error('Form not found');

    const slugName = projectName && projectName?.trim() !== 'null'
      ? `${slug}_${this.sanitize(projectName)}`
      : slug;

    // 2. Build dynamic schema + model
    const schema = this.createDynamicSchema(meta.formSchema || [], dbConnection, slug);
    const DynamicModel = dbConnection.model(slugName, schema, slugName);

    // 3. Collect all fields
    const allFields = (meta.formSchema || []).flatMap((page: any) => page.elements || []);

    // 4. Clone input data
    let doc = { ...rawData };

    // 5. Compute virtual fields (simplified for now)
    await this.evaluateVirtualFields(allFields, doc, dbConnection);

    // 6. Handle History fields
    await this.processHistoryFields(allFields, doc, dbConnection, slugName, loggedInUserId, entryId || undefined);

    // 7. Add workflow steps if this is a new entry
    if (!entryId && meta.workflows && meta.workflows.length > 0) {
      doc.workFlowSteps = this.createStepsArray(meta.workflows.length);
    }

    // 8. Validate
    const tempDoc = new DynamicModel({ ...doc, isDraft, createdBy: loggedInUserId });
    const validationError = tempDoc.validateSync();
    if (validationError) {
      const err = new Error('Validation failed');
      (err as any).details = validationError.errors;
      throw err;
    }

    // 9. Insert or Update
    const collection = dbConnection.collection(slugName);
    let response;

    if (entryId) {
      // Update existing entry
      const updateData = {
        ...doc,
        updatedAt: new Date(),
        isDraft,
      };

      if (stepNo !== undefined && approvalStatus) {
        updateData[`workFlowSteps.${stepNo}.approvalStatus`] = approvalStatus;
        if (approvalStatus === 'Approved') {
          updateData[`workFlowSteps.${stepNo}.approvedAt`] = new Date();
          updateData[`workFlowSteps.${stepNo}.approvedBy`] = loggedInUserId;
        }
      }

      response = await collection.findOneAndUpdate(
        { _id: new ObjectId(entryId) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
    } else {
      // Insert new entry
      const insertData = {
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: new ObjectId(loggedInUserId),
        isDraft,
      };

      response = await collection.insertOne(insertData);
      response._id = response.insertedId;
    }

    return response;
  }

  private async processHistoryFields(
    allFields: any[],
    doc: any,
    dbConnection: Connection,
    slugName: string,
    loggedInUserId: string,
    entryId?: string
  ): Promise<void> {
    for (const field of allFields) {
      if (field.type === 'History' && field.properties?.label) {
        const fieldKey = field.properties.label
          .replace(/\s+/g, '_')
          .toLowerCase();
        const refCollection = `${slugName}_${fieldKey}`;
        const HistoryColl = dbConnection.collection(refCollection);

        if (Array.isArray(doc[fieldKey])) {
          const historyElements = field.elements || [];
          const docsToInsert = [] as any[];

          for (let entry of doc[fieldKey]) {
            let processedEntry = { ...entry };
            await this.evaluateVirtualFields(historyElements, processedEntry, dbConnection);

            processedEntry.createdAt = new Date();
            processedEntry.createdBy = new ObjectId(loggedInUserId);
            if (entryId) processedEntry.parentId = new ObjectId(entryId);

            docsToInsert.push(processedEntry);
          }

          if (docsToInsert.length) {
            const insertResult = await HistoryColl.insertMany(docsToInsert);
            doc[fieldKey] = Object.values(insertResult.insertedIds);
          }
        }
      }
    }
  }

  private async evaluateVirtualFields(fields: any[], doc: any, dbConnection: Connection): Promise<void> {
    // Simplified virtual field evaluation - can be expanded later
    for (const field of fields) {
      if (field.type === 'Virtual' && field.properties?.formula) {
        try {
          // Basic formula evaluation (simplified)
          const formula = field.properties.formula;
          const fieldKey = this.sanitize(field.properties.label);

          // Simple arithmetic operations for now
          if (formula.includes('+') || formula.includes('-') || formula.includes('*') || formula.includes('/')) {
            const result = this.evaluateSimpleFormula(formula, doc);
            doc[fieldKey] = result;
          }
        } catch (error) {
          console.warn(`Virtual field evaluation failed for ${field.properties.label}:`, error);
        }
      }
    }
  }

  private evaluateSimpleFormula(formula: string, doc: any): number {
    // Very basic formula evaluation - replace with proper evaluator if needed
    try {
      let expression = formula;

      // Replace field references with actual values
      Object.keys(doc).forEach(key => {
        const value = parseFloat(doc[key]) || 0;
        expression = expression.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
      });

      // Basic safety check - only allow numbers and basic operators
      if (!/^[\d+\-*/.() ]+$/.test(expression)) {
        throw new Error('Invalid formula');
      }

      return eval(expression);
    } catch (error) {
      return 0;
    }
  }

  private createStepsArray(length: number): any[] {
    return Array.from({ length }, (_, i) => ({
      Step: i,
      triggerStatus: false,
      approvalStatus: '',
      rejections: [],
      triggeredAt: null,
      approvedAt: null,
      approvedBy: null,
    }));
  }

  private sanitize(s: string): string {
    return s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9-_]/g, '');
  }

  private registerSchemas(dbConnection: Connection): void {
    // Register User schema if not already registered
    if (!dbConnection.models.User) {
      const userSchema = require('../auth/schemas/user.schema').UserSchema;
      dbConnection.model('User', userSchema);
    }
  }
}