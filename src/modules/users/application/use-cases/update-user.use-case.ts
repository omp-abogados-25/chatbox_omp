import { Injectable } from '@nestjs/common';
import { AbstractUpdateUserRepository, UpdateUserInput, User } from '../../domain';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly updateUserRepository: AbstractUpdateUserRepository,
  ) {}

  async execute(id: string, data: UpdateUserInput): Promise<User | null> {
    return this.updateUserRepository.execute(id, data);
  }
} 