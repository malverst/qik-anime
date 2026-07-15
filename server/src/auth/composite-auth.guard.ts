import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTokenGuard } from './api-token.guard';

/**
 * Composite guard — passes if EITHER JWT auth OR API token auth succeeds.
 * Use this on routes that should accept both user JWTs and server-to-server API tokens.
 */
@Injectable()
export class CompositeAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtAuthGuard,
    private readonly token: ApiTokenGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const jwtOk = await this.jwt.canActivate(context);
      if (jwtOk) return true;
    } catch { /* JWT failed, try token */ }

    try {
      const tokenOk = await this.token.canActivate(context);
      if (tokenOk) return true;
    } catch { /* also failed */ }

    return false;
  }
}
