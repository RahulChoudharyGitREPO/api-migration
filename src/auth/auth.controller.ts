import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Headers,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { DynamicDbGuard } from "../common/guards/dynamic-db.guard";
import {
  CompanyName,
  DatabaseConnection,
} from "../common/decorators/dynamic-db.decorator";
import type { Request } from "express";
import { Connection } from "mongoose";

@Controller(":companyName/api/account")
@UseGuards(DynamicDbGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    return this.authService.register(
      registerUserDto,
      companyName,
      dbConnection,
    );
  }

  @Post("login")
  async login(
    @Body() loginDto: LoginDto,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    return this.authService.login(loginDto, companyName, dbConnection);
  }

  @Post("forget-password")
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    return this.authService.forgotPassword(
      forgotPasswordDto,
      companyName,
      dbConnection,
    );
  }

  @Post("set-password")
  async setPassword(
    @Body() setPasswordDto: SetPasswordDto,
    @CompanyName() companyName: string,
    @DatabaseConnection() dbConnection: Connection,
  ) {
    return this.authService.setPassword(
      setPasswordDto,
      companyName,
      dbConnection,
    );
  }

  @Post("verify-user")
  verifyUser(
    @Headers("authorization") authHeader: string,
    @CompanyName() companyName: string,
  ) {
    // Extract token from "Bearer <token>" format
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader;

    return this.authService.verifyUser(token, companyName);
  }
}
