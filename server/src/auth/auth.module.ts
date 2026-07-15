import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy, JWT_SECRET } from './jwt.strategy';
import { ApiToken } from './api-token.entity';
import { ApiTokenGuard } from './api-token.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CompositeAuthGuard } from './composite-auth.guard';

@Global()
@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([ApiToken]),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ApiTokenGuard, JwtAuthGuard, CompositeAuthGuard],
  exports: [JwtStrategy, PassportModule, ApiTokenGuard, CompositeAuthGuard],
})
export class AuthModule {}
