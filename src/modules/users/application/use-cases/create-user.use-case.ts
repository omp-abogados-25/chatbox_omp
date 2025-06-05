import { Injectable } from '@nestjs/common';
import { AbstractCreateUserRepository, CreateUserInput, User } from '../../domain';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly createUserRepository: AbstractCreateUserRepository,
  ) {}

  async execute(data: CreateUserInput): Promise<User> {
    return this.createUserRepository.execute(data);
  }
} 