import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class ForgotPasswordRequestDto {
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  email: string;
}

export class VerifyPasswordResetCodeDto {
  @IsString({ message: 'El sessionId es requerido' })
  sessionId: string;

  @IsString({ message: 'El código es requerido' })
  @Length(6, 6, { message: 'El código debe tener 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'El código debe contener solo números' })
  code: string;
}

export class ResetPasswordDto {
  @IsString({ message: 'El sessionId es requerido' })
  sessionId: string;

  @IsString({ message: 'La contraseña es requerida' })
  @Length(6, 100, { message: 'La contraseña debe tener entre 6 y 100 caracteres' })
  password: string;

  @IsString({ message: 'La confirmación de contraseña es requerida' })
  confirmPassword: string;
}

export class ForgotPasswordResponseDto {
  message: string;
  sessionId: string;
  expiresIn: number; // minutos
  success: boolean;
}

export class VerifyCodeResponseDto {
  message: string;
  success: boolean;
}

export class ResetPasswordResponseDto {
  message: string;
  success: boolean;
} 