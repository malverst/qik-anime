import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { AuditLog } from './audit-log.entity';
import { ApiToken } from '../auth/api-token.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuditLog, ApiToken])],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
