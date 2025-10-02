import { Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    console.log('JwtAuthGuard - Authorization header:', request.headers.authorization?.substring(0, 50) + '...');
    console.log('JwtAuthGuard - URL:', request.url);
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('JwtAuthGuard - handleRequest - Error:', err);
    console.log('JwtAuthGuard - handleRequest - User:', user);
    console.log('JwtAuthGuard - handleRequest - Info:', info);

    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}
