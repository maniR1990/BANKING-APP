import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // 0. Microservice Exception: Always allow internal RPC/Event traffic (RabbitMQ)
    if (context.getType() === 'rpc') {
      return true;
    }

    // 1. Check for @Public() metadata
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Extract Request Object (Handle HTTP and GraphQL)
    const request = this.getRequest(context);

    if (!request) {
      throw new UnauthorizedException('Request context not found');
    }

    // 3. Header Check
    // Nginx auth_request_set proxies the user ID as X-User-ID.
    // In Node.js, HTTP headers are lowercased: 'x-user-id'.
    const userId = request.headers['x-user-id'];

    if (!userId) {
      throw new UnauthorizedException('Authentication required (Missing X-User-ID)');
    }

    // 4. Context Injection
    // Attach the user to the request object so @CurrentUser() can easily extract it later.
    request.user = { id: userId };

    return true; // Allow the request
  }

  private getRequest(context: ExecutionContext) {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    } else if ((context.getType() as string) === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context).getContext();
      // Expecting { req } in GraphQLModule context configuration
      return gqlContext.req;
    }
    return null;
  }
}
