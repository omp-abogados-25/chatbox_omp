import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '../../application/services/auth.service';
import { LoginRequestDto, RefreshTokenRequestDto, AuthResponseDto, LogoutResponseDto, AuthUserResponseDto } from '../dtos';
import { Public } from '../../infrastructure/decorators/public.decorator';
import { CurrentUser } from '../../infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Iniciar sesión',
    description: 'Autentica al usuario con email y contraseña, devuelve tokens JWT' 
  })
  @ApiOkResponse({ 
    description: 'Login exitoso',
    type: AuthResponseDto 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Datos incorrectos o usuario sin permisos' 
  })
  @ApiBadRequestResponse({ 
    description: 'Datos de entrada inválidos' 
  })
  async login(@Body() loginDto: LoginRequestDto): Promise<AuthResponseDto> {
    const tokens = await this.authService.login(loginDto.email, loginDto.password);
    
    // Obtener información del usuario
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        can_login: user.can_login,
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Renovar token de acceso',
    description: 'Genera un nuevo access token usando el refresh token' 
  })
  @ApiOkResponse({ 
    description: 'Token renovado exitosamente',
    type: AuthResponseDto 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Refresh token inválido o expirado' 
  })
  @ApiBadRequestResponse({ 
    description: 'Datos de entrada inválidos' 
  })
  async refresh(@Body() refreshDto: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    const tokens = await this.authService.refreshTokens(refreshDto.refresh_token);
    
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      user: null, // No devolvemos info del usuario en refresh
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Cerrar sesión',
    description: 'Revoca el refresh token del usuario actual' 
  })
  @ApiOkResponse({ 
    description: 'Sesión cerrada exitosamente',
    type: LogoutResponseDto 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Token de acceso inválido' 
  })
  async logout(@Body() refreshDto: RefreshTokenRequestDto): Promise<LogoutResponseDto> {
    await this.authService.logout(refreshDto.refresh_token);
    
    return {
      message: 'Sesión cerrada exitosamente',
      success: true,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Cerrar sesión en todos los dispositivos',
    description: 'Revoca todos los refresh tokens del usuario actual' 
  })
  @ApiOkResponse({ 
    description: 'Sesión cerrada en todos los dispositivos',
    type: LogoutResponseDto 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Token de acceso inválido' 
  })
  async logoutAll(@CurrentUser() user: any): Promise<LogoutResponseDto> {
    await this.authService.logoutAllDevices(user.userId);
    
    return {
      message: 'Sesión cerrada en todos los dispositivos',
      success: true,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Obtener información del usuario actual',
    description: 'Devuelve la información del usuario autenticado' 
  })
  @ApiOkResponse({ 
    description: 'Información del usuario',
    type: AuthUserResponseDto 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Token de acceso inválido' 
  })
  async getMe(@CurrentUser() user: any): Promise<AuthUserResponseDto> {
    return {
      id: user.userId,
      email: user.email,
      full_name: user.full_name,
      can_login: true, // Si llegó aquí, puede hacer login
    };
  }
} 