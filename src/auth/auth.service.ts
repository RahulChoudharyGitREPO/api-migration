import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Model, Types, Connection } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { User, UserDocument, UserSchema } from "./schemas/user.schema";
import { LoginDto } from "./dto/login.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { EmailService } from "../email/email.service";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private getUserModel(dbConnection: Connection): Model<any> {
    return dbConnection.model("User", UserSchema, "users");
  }

  /**
   * Encrypts password using SHA-256 (double encryption as per original)
   */
  private encryptPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  /**
   * Generates JWT token with company-specific secret
   */
  generateToken(userData: any, companyName: string): string {
    const payload = {
      user_id: userData._id.toString(),
      user_name: userData.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };

    const secret = process.env.JWT_SECRET + companyName;
    return this.jwtService.sign(payload, { secret });
  }

  /**
   * Login endpoint
   */
  async login(
    loginDto: LoginDto,
    companyName: string,
    dbConnection: Connection,
  ) {
    try {
      // Double encryption as per original implementation
      const firstEncryption = this.encryptPassword(loginDto.Password);
      const secondEncryption = this.encryptPassword(firstEncryption);

      const userModel = this.getUserModel(dbConnection);
      const result = await userModel.findOne({
        email: loginDto.Email,
        password: secondEncryption,
      });

      const isRemoved = result?.isRemove;
      const user = isRemoved ? null : result;

      if (user != null) {
        const JwtToken = this.generateToken(user, companyName);
        const response = {
          Token: JwtToken,
          UserName: user?.name,
          labName: "",
          user: user,
        };
        return { success: true, message: "Login successful", data: response };
      } else {
        return {
          success: true,
          message: "Email and Password combination does not match.",
          isRemoved: isRemoved,
        };
      }
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  /**
   * Register user endpoint
   */
  async register(
    registerUserDto: RegisterUserDto,
    companyName: string,
    dbConnection: Connection,
  ) {
    try {
      const userModel = this.getUserModel(dbConnection);

      const email = registerUserDto.Email?.toLowerCase()?.trim();
      const mobile = registerUserDto.mobile;

      // Check if user already exists
      let existingEmailUser = await userModel.findOne({ email });
      let existingMobileUser = await userModel.findOne({ mobile });

      // Handle removed users (soft deleted) by permanently deleting them
      if (existingEmailUser && existingEmailUser.isRemove) {
        await userModel.findByIdAndDelete(existingEmailUser._id);
        existingEmailUser = null;
        existingMobileUser = null;
      }

      if (existingMobileUser && existingMobileUser.isRemove) {
        await userModel.findByIdAndDelete(existingMobileUser._id);
        existingMobileUser = null;
        existingEmailUser = null;
      }

      // Check for existing users when creating new user
      if (registerUserDto._id) {
        // Update existing user logic
        if (
          existingMobileUser &&
          (existingMobileUser._id.toString() !== registerUserDto._id ||
            existingMobileUser.email !== email)
        ) {
          return {
            success: false,
            message: "Mobile number already exists.",
          };
        }
        existingEmailUser = null; // Allow update if it's the same user
      } else {
        // Create new user logic
        if (existingEmailUser) {
          return { success: false, message: "Email already exists." };
        }
        if (existingMobileUser) {
          return {
            success: false,
            message: "Mobile number already exists.",
          };
        }
      }

      // Create or update user
      let user;
      if (registerUserDto._id) {
        // Update existing user
        const updateData = {
          name: registerUserDto.name,
          email: registerUserDto.Email?.toLowerCase()?.trim(),
          mobile: registerUserDto.mobile,
          role: registerUserDto.role,
          isActive: registerUserDto.isActive,
          profilePic: registerUserDto.profilePic,
          species: registerUserDto.species,
          companies: registerUserDto.companies,
          addressLine1: registerUserDto.addressLine1,
          addressLine2: registerUserDto.addressLine2,
          labMaster: registerUserDto.labMaster,
          entities: registerUserDto.entities,
          projects: registerUserDto.projects,
        };

        user = await userModel.findByIdAndUpdate(
          registerUserDto._id,
          updateData,
          {
            new: true,
            runValidators: true,
          },
        );
      } else {
        // Create new user with encrypted password
        const firstEncryption = this.encryptPassword(registerUserDto.Password);
        const secondEncryption = this.encryptPassword(firstEncryption);

        const userData = {
          name: registerUserDto.name,
          email: registerUserDto.Email?.toLowerCase()?.trim(),
          mobile: registerUserDto.mobile,
          password: secondEncryption,
          role: registerUserDto.role,
          isActive: registerUserDto.isActive || true,
          profilePic: registerUserDto.profilePic,
          species: registerUserDto.species,
          companies: registerUserDto.companies,
          addressLine1: registerUserDto.addressLine1,
          addressLine2: registerUserDto.addressLine2,
          labMaster: registerUserDto.labMaster,
          entities: registerUserDto.entities,
          projects: registerUserDto.projects,
        };

        user = new userModel(userData);
        const savedUser = await user.save();

        user = await userModel.findById(savedUser._id);
      }

      return {
        success: true,
        message: "Registration successful",
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Forgot password - sends reset link via email
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    companyName: string,
    dbConnection: Connection,
  ) {
    const userModel = this.getUserModel(dbConnection);
    const user = await userModel.findOne({
      email: forgotPasswordDto.email,
    });

    if (!user) {
      return { success: false, message: "Email does not exists." };
    }

    const resetPasswordGuid = uuidv4();
    await userModel.findOneAndUpdate(
      { email: forgotPasswordDto.email },
      { passwordHash: resetPasswordGuid },
      { new: true },
    );

    const baseUrl =
      forgotPasswordDto.hostURL ||
      process.env.HOSTNAME ||
      "http://localhost:3000";
    const url = `${baseUrl}/${companyName}/?userId=${resetPasswordGuid}&type=createpassword`;

    // Send email with reset link
    const emailSent = await this.emailService.sendResetPasswordEmail(user, url);

    if (!emailSent) {
      console.log("Reset password URL (email failed):", url);
      return {
        success: false,
        message: "Failed to send reset password email.",
      };
    }

    return { success: true, message: "Reset password link sent to email." };
  }

  /**
   * Set/Reset password
   */
  async setPassword(
    setPasswordDto: SetPasswordDto,
    companyName: string,
    dbConnection: Connection,
  ) {
    const userModel = this.getUserModel(dbConnection);
    const user = await userModel.findOne({
      passwordHash: setPasswordDto.userId,
    });

    if (!user) {
      return { success: true, message: "User does not exist" };
    }

    // Double encryption
    const firstEncryption = this.encryptPassword(setPasswordDto.password);
    const secondEncryption = this.encryptPassword(firstEncryption);

    const updatedUser = await userModel.findOneAndUpdate(
      { passwordHash: setPasswordDto.userId },
      { password: secondEncryption },
      { new: true },
    );

    return {
      success: true,
      message: "Reset Password successfully",
      userData: updatedUser,
    };
  }

  /**
   * Verify JWT token
   */
  verifyUser(token: string, companyName: string) {
    if (!token) {
      return { success: false, message: "No token provided" };
    }

    try {
      const secret = process.env.JWT_SECRET + companyName;
      const decoded = this.jwtService.verify(token, { secret });
      return { success: true, message: "verify Token success" };
    } catch (err) {
      return {
        success: false,
        message: "Failed to authenticate token",
        data: null,
      };
    }
  }

  /**
   * Get logged-in user info from token
   */
  getLoggedInUserInfo(token: string, companyName: string) {
    try {
      const secret = process.env.JWT_SECRET + companyName;
      const decoded = this.jwtService.verify(token, { secret });
      return decoded;
    } catch {
      throw new UnauthorizedException("Failed to authenticate token");
    }
  }
}
