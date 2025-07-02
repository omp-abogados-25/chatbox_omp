import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AuthTokens, AuthUser, JwtPayload, RefreshTokenPayload } from '../../domain/entities';
import { AbstractFindUserByEmailRepository, AbstractFindUserByIdRepository } from '../../../users/domain/repositories';
import { User } from '../../../users/domain/entities';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly JWT_ACCESS_EXPIRATION: string;
  private readonly JWT_REFRESH_EXPIRATION: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly findUserByEmailRepository: AbstractFindUserByEmailRepository,
    private readonly findUserByIdRepository: AbstractFindUserByIdRepository,
    private readonly refreshTokenService: RefreshTokenService,
  ) {
    this.JWT_ACCESS_SECRET = this.configService.get<string>('JWT_ACCESS_SECRET') || 'default-access-secret';
    this.JWT_REFRESH_SECRET = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret';
    this.JWT_ACCESS_EXPIRATION = this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
    this.JWT_REFRESH_EXPIRATION = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
  }

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.findUserByEmailRepository.execute(email);
    
    if (!user) {
      return null;
    }

    if (!user.can_login) {
      throw new UnauthorizedException('El usuario no tiene permisos para iniciar sesión');
    }

    if (!user.password) {
      throw new UnauthorizedException('El usuario no tiene contraseña configurada');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      can_login: user.can_login,
    };
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Datos incorrectos');
    }

    return this.generateTokens(user);
  }

  async generateTokens(user: AuthUser): Promise<AuthTokens> {
    const tokenId = uuidv4();
    
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      full_name: user.full_name,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      tokenId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.JWT_ACCESS_SECRET,
        expiresIn: this.JWT_ACCESS_EXPIRATION,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.JWT_REFRESH_SECRET,
        expiresIn: this.JWT_REFRESH_EXPIRATION,
      }),
    ]);

    // Guardar el refresh token en la base de datos
    await this.refreshTokenService.createRefreshToken(user.id, refreshToken, tokenId);

    // Calcular tiempo de expiración en segundos
    const expiresIn = this.parseExpirationToSeconds(this.JWT_ACCESS_EXPIRATION);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      token_type: 'Bearer',
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.JWT_REFRESH_SECRET,
      });

      // Verificar que el token existe y no está revocado
      const storedToken = await this.refreshTokenService.findRefreshToken(refreshToken);
      if (!storedToken || storedToken.isRevoked) {
        throw new UnauthorizedException('Refresh token inválido o revocado');
      }

      // Verificar que no haya expirado
      if (storedToken.expiresAt < new Date()) {
        await this.refreshTokenService.revokeRefreshToken(refreshToken);
        throw new UnauthorizedException('Refresh token expirado');
      }

      // Obtener el usuario por ID
      const userById = await this.findUserByIdRepository.execute(payload.sub);
      if (!userById || !userById.can_login) {
        throw new UnauthorizedException('Usuario no válido');
      }

      // Revocar el token actual
      await this.refreshTokenService.revokeRefreshToken(refreshToken);

      // Generar nuevos tokens
      const authUser: AuthUser = {
        id: userById.id,
        email: userById.email,
        full_name: userById.full_name,
        can_login: userById.can_login,
      };

      return this.generateTokens(authUser);
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      await this.refreshTokenService.revokeRefreshToken(refreshToken);
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.JWT_ACCESS_SECRET,
      });
    } catch (error) {
      throw new UnauthorizedException('Token de acceso inválido');
    }
  }

  private parseExpirationToSeconds(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900; // 15 minutos por defecto
    }
  }
} 