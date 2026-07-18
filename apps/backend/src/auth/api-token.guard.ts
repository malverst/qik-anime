import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiToken } from './api-token.entity';

@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiToken)
    private readonly tokens: Repository<ApiToken>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.authorization || '';
    if (!auth.startsWith('Bearer ')) return false;
    const token = auth.slice(7);
    if (!token) return false;

    const record = await this.tokens.findOne({ where: { token, active: true } });
    if (!record) return false;
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) return false;

    return true;
  }
}
