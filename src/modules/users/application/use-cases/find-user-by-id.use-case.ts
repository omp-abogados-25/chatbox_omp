import { Injectable } from '@nestjs/common';
import { AbstractFindUserByIdRepository, User } from '../../domain';

@Injectable()
export class FindUserByIdUseCase {
  constructor(
    private readonly findUserByIdRepository: AbstractFindUserByIdRepository,
  ) {}

  async execute(id: string): Promise<User | null> {
    return this.findUserByIdRepository.execute(id);
  }
} 