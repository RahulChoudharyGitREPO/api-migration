import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicDbGuard } from '../common/guards/dynamic-db.guard';

@Controller(':companyName/api/dashboard')
@UseGuards(JwtAuthGuard, DynamicDbGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getHealth() {
    return 'Dashboard api is working:)';
  }

  @Get('sgif/project/list')
  async getSgifProjectList() {
    return this.dashboardService.getSgifProjectList();
  }

  @Get('ky/project/list')
  async getKyProjectList() {
    return this.dashboardService.getKyProjectList();
  }
}
