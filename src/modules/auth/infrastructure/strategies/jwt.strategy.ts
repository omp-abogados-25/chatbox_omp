import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../domain/entities';
import { AbstractFindUserByIdRepository } from '../../../users/domain/repositories';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly findUserByIdRepository: AbstractFindUserByIdRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'default-access-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.findUserByIdRepository.execute(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.can_login) {
      throw new UnauthorizedException('Usuario sin permisos de acceso');
    }

    return {
      userId: user.id,
      email: user.email,
      full_name: user.full_name,
    };
  }
} 