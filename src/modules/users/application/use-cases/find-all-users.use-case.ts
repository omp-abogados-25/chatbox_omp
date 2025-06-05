import { Injectable } from '@nestjs/common';
import { AbstractFindAllUsersRepository, User } from '../../domain';

@Injectable()
export class FindAllUsersUseCase {
  constructor(
    private readonly findAllUsersRepository: AbstractFindAllUsersRepository,
  ) {}

  async execute(): Promise<User[]> {
    return this.findAllUsersRepository.execute();
  }
} 