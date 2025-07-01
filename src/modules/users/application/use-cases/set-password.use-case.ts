import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AbstractFindUserByIdRepository, AbstractUpdateUserRepository, User } from '../../domain';
import * as bcrypt from 'bcrypt';

export interface SetPasswordInput {
  userId: string;
  password: string;
  confirmPassword: string;
}

@Injectable()
export class SetPasswordUseCase {
  constructor(
    private readonly findUserByIdRepository: AbstractFindUserByIdRepository,
    private readonly updateUserRepository: AbstractUpdateUserRepository,
  ) {}

  async execute(data: SetPasswordInput): Promise<User> {
    // Validar que las contraseñas coincidan
    if (data.password !== data.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // Verificar que el usuario existe
    const user = await this.findUserByIdRepository.execute(data.userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Encriptar la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Actualizar el usuario con la nueva contraseña y habilitar login
    const updatedUser = await this.updateUserRepository.execute(data.userId, {
      password: hashedPassword,
      can_login: true
    });

    if (!updatedUser) {
      throw new BadRequestException('Error al actualizar la contraseña');
    }

    return updatedUser;
  }
} 