import { Injectable } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { UserSchema } from '../auth/schemas/user.schema';

@Injectable()
export class WorkflowTriggerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  private getUserModel(dbConnection: Connection): Model<any> {
    if (!dbConnection.models['users']) {
      return dbConnection.model('users', UserSchema, 'users');
    }
    return dbConnection.models['users'];
  }

  /**
   * Trigger a single workflow for a form submission
   */
  async triggerSingleWorkFlow(
    doc: any,
    slug: string,
    form: any,
    dbConnection: Connection,
    stepNo: number,
    companyName: string,
    project: string | null = null,
  ): Promise<{ success: boolean; step: number }> {
    try {
      const hostname = this.configService.get<string>('HOSTNAME') || 'http://localhost:3000';
      const UserModel = this.getUserModel(dbConnection);

      // Check if previous step was approved (for sequential workflows)
      const isPreviousOneApproved =
        stepNo != 0
          ? doc?.workFlowSteps?.[stepNo - 1]?.approvalStatus === 'Approved'
          : false;

      const workflow = form?.workflows?.[stepNo];

      if (!workflow) {
        return { success: false, step: stepNo };
      }

      // --- Evaluate workflow-level conditions ---
      const results = workflow?.triggers?.map((cond: any) => {
        const fieldVal = doc[cond.field];
        switch (cond.operation) {
          case '=':
            return fieldVal == cond.value;
          case '!=':
            return fieldVal != cond.value;
          case '>':
            return fieldVal > cond.value;
          case '<':
            return fieldVal < cond.value;
          case '>=':
            return fieldVal >= cond.value;
          case '<=':
            return fieldVal <= cond.value;
          default:
            return false;
        }
      }) || [];

      const workflowTriggered =
        (workflow?.logicOperator === 'AND'
          ? results?.every(Boolean)
          : results?.some(Boolean)) || isPreviousOneApproved;

      if (!workflowTriggered) {
        return { success: false, step: stepNo };
      }

      // ✅ Run steps
      for (const step of workflow.steps) {
        let stepTriggered = true;

        // Evaluate step-level triggers
        if (step.triggers?.length > 0) {
          const stepResults = step.triggers.map((cond: any) => {
            const fieldVal = doc[cond.field];
            switch (cond.operation) {
              case '=':
                return fieldVal == cond.value;
              case '!=':
                return fieldVal != cond.value;
              case '>':
                return fieldVal > cond.value;
              case '<':
                return fieldVal < cond.value;
              case '>=':
                return fieldVal >= cond.value;
              case '<=':
                return fieldVal <= cond.value;
              default:
                return false;
            }
          });
          stepTriggered = stepResults.every(Boolean);
        }

        if (!stepTriggered) continue;

        // --- Handle different actions ---
        if (step.action === 'email' && step.users?.length > 0) {
          const selectedFields = step.selectedFields || [];

          // Populate user details
          const users = await UserModel.find({
            _id: { $in: step.users.map((id: any) => id.toString()) },
          }).lean();

          const recipients = users.map((u: any) => u.email).filter(Boolean);
          const recipients2 = users.map((u: any) => u.email).filter(Boolean);

          // Build result object with selected fields
          const result = [
            {
              ...selectedFields.reduce((acc: any, key: string) => {
                const value = doc[key];
                const isObject =
                  typeof value === 'object' &&
                  value !== null &&
                  !Array.isArray(value);

                let finalValue = isObject
                  ? Object.keys(value)
                      .filter((k) => value[k])
                      .join(',')
                  : value;

                if (
                  finalValue !== undefined &&
                  finalValue !== null &&
                  finalValue !== ''
                ) {
                  acc[key] = finalValue;
                }

                return acc;
              }, {}),
              ...(recipients2?.[0] ? { 'Created by': recipients2[0] } : {}),
            },
          ];

          // Send emails to workflow users
          if (recipients.length) {
            await Promise.all(
              recipients.map((recipient: string) => {
                const url = `${hostname}/${companyName}/dynamic-ui/details?slug=${slug}&id=${doc?._id}&isApprovedScreen=true&step=${stepNo}&email=${recipient}&project=${project}`;
                const body = this.createMailNotificationTemplate(
                  url,
                  step.message,
                  result,
                );

                return this.emailService.sendEmail(
                  recipient,
                  `Workflow Notification | Form ${slug} - Id ${doc?._id}`,
                  body,
                );
              }),
            );
          }
        }

        // 🆕 NEW: Notify Manager Logic
        if (step?.notifyManager) {
          const selectedFields = step.selectedFields || [];

          // Get the creator user with their project manager populated
          const users = await UserModel.find({
            _id: { $in: [doc?.createdBy?.toString()] },
          })
            .populate('projectManager')
            .lean();

          const projectManagerEmails =
            users
              .map((user: any) => user?.projectManager?.email)
              .filter(Boolean) || [];

          const recipients2 = users.map((u: any) => u.email).filter(Boolean);

          // Build result object with selected fields
          const result = [
            {
              ...selectedFields.reduce((acc: any, key: string) => {
                const value = doc[key];
                const isObject =
                  typeof value === 'object' &&
                  value !== null &&
                  !Array.isArray(value);

                let finalValue = isObject
                  ? Object.keys(value)
                      .filter((k) => value[k])
                      .join(',')
                  : value;

                if (
                  finalValue !== undefined &&
                  finalValue !== null &&
                  finalValue !== ''
                ) {
                  acc[key] = finalValue;
                }

                return acc;
              }, {}),
              ...(recipients2?.[0] ? { 'Created by': recipients2[0] } : {}),
            },
          ];

          // Send emails to project managers
          if (projectManagerEmails.length) {
            await Promise.all(
              projectManagerEmails.map((recipient: string) => {
                if (recipient) {
                  const url = `${hostname}/${companyName}/dynamic-ui/details?slug=${slug}&id=${doc?._id}&isApprovedScreen=false&step=${stepNo}&email=${recipient}`;

                  const body = this.createMailNotificationTemplate(
                    url,
                    `you are getting this notification because ${users?.[0]?.name} filled this form`,
                    result,
                  );

                  return this.emailService.sendEmail(
                    recipient,
                    `Workflow Notification | Form ${slug} - Id ${doc?._id}`,
                    body,
                  );
                }
              }),
            );
          }
        }

        // Notify Creator
        if (
          step.notifyCreator &&
          step.notifyChannels.email &&
          stepNo == 0 &&
          doc?.createdBy
        ) {
          const creator: any = await UserModel.findById(doc.createdBy).lean();
          if (creator?.email) {
            const url = `${hostname}/${companyName}/dynamic-ui/details?slug=${slug}&id=${doc?._id}`;
            const body = this.createMailNotificationTemplate(
              url,
              step.creatorMessage || 'Your form has been submitted successfully',
              [],
            );

            await this.emailService.sendEmail(
              creator.email,
              `Form Submission Confirmation | ${slug}`,
              body,
            );
          }
        }
      }

      return { success: true, step: stepNo };
    } catch (error) {
      console.error('Error in triggerSingleWorkFlow:', error);
      return { success: false, step: stepNo };
    }
  }

  /**
   * Create email notification template
   */
  private createMailNotificationTemplate(
    url: string,
    message: string,
    data: any[],
  ): string {
    const dataRows = data
      .map((item) => {
        return Object.entries(item)
          .map(
            ([key, value]) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${key}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${value}</td>
          </tr>
        `,
          )
          .join('');
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Workflow Notification</h1>
          </div>
          <div style="padding: 30px;">
            <p style="color: #333; font-size: 16px; line-height: 1.5;">${message}</p>
            ${
              dataRows
                ? `
              <h3 style="color: #333; margin-top: 20px;">Form Data:</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                ${dataRows}
              </table>
            `
                : ''
            }
            <div style="text-align: center; margin-top: 30px;">
              <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">View Details</a>
            </div>
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p style="margin: 0;">This is an automated notification from your workflow system.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
