import { IsArray, IsString, IsNotEmpty, ArrayNotEmpty, IsUUID, MinLength, MaxLength } from 'class-validator';

export class ActivateUsersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds: string[];
}

export class ActivateUsersResponseDto {
  message: string;
  success: boolean;
  activatedCount: number;
  sessions: {
    userId: string;
    sessionId: string;
    email: string;
  }[];
}

export class VerifyActivationCodeDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

export class VerifyActivationCodeResponseDto {
  message: string;
  success: boolean;
}

export class SetNewUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export class SetNewUserPasswordResponseDto {
  message: string;
  success: boolean;
} 