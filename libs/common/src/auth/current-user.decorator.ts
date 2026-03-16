import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    let request;
    if (context.getType() === 'http') {
      request = context.switchToHttp().getRequest();
    } else if ((context.getType() as string) === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context).getContext();
      request = gqlContext.req;
    }

    if (!request) {
      return null;
    }

    // Returns the entire user object attached by GatewayAuthGuard
    // Or just the user object. We typically attach { id: string }
    return request.user;
  },
);
