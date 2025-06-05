import { Injectable } from '@nestjs/common';
import { AbstractDeleteUserRepository, User } from '../../domain';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly deleteUserRepository: AbstractDeleteUserRepository,
  ) {}

  async execute(id: string): Promise<User | null> {
    return this.deleteUserRepository.execute(id);
  }
} 