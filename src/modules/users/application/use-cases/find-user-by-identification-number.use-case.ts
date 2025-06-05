import { Injectable } from '@nestjs/common';
import { AbstractFindUserByIdentificationNumberRepository, User } from '../../domain/repositories';

@Injectable()
export class FindUserByIdentificationNumberUseCase {
  constructor(
    private readonly findUserByIdentificationNumberRepository: AbstractFindUserByIdentificationNumberRepository,
  ) {}

  async execute(identificationNumber: string): Promise<User | null> {
    return this.findUserByIdentificationNumberRepository.execute(identificationNumber);
  }
} 