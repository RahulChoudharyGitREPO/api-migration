import { Module,  MiddlewareConsumer, NestModule, RequestMethod  } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { DynamicDbModule } from "./database/dynamic-db.module";
import { EntitiesModule } from "./entities/entities.module";
import { UploadModule } from "./upload/upload.module";
import { FormsModule } from "./forms/forms.module";
import { ProjectsModule } from "./projects/projects.module";
import { DashboardModule } from './dashboard/dashboard.module';
import { DonorsModule } from './donors/donors.module';
import { PartnersModule } from './partners/partners.module';
import { ProgramsModule } from './programs/programs.module';
import { KpiModule } from './kpi/kpi.module';
import { PhcModule } from './phc/phc.module';
import { DrillModule } from './drill/drill.module';
import { ProfessionModule } from './profession/profession.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { CaregiversModule } from './caregivers/caregivers.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtVerifyMiddleware } from './common/middleware/jwt-verify.middleware';
import { getCompanyName } from './common/utils/company-name.extractor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    JwtModule.register({}),
    DynamicDbModule,
    AuthModule,
    UsersModule,
    EntitiesModule,
    UploadModule,
    FormsModule,
    ProjectsModule,
    DashboardModule,
    DonorsModule,
    PartnersModule,
    ProgramsModule,
    KpiModule,
    PhcModule,
    DrillModule,
    ProfessionModule,
    OnboardingModule,
    CaregiversModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtVerifyMiddleware)
      .exclude(
        // exclude ALL auth routes, e.g. /auth, /auth/login, /auth/refresh, etc.
       { path: `:company/api/account`, method: RequestMethod.ALL },
        { path: `:company/api/account/(.*)`, method: RequestMethod.ALL },
        { path: 'krisiyukta/api/entity/details', method: RequestMethod.ALL },

        
      )
      .forRoutes('*');
  }
}
