import { AbstractFindAllRoleFunctionsRepository, RoleFunction } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class FindAllRoleFunctionsUseCase {
  constructor(
    @Inject(AbstractFindAllRoleFunctionsRepository)
    private readonly roleFunctionFinder: AbstractFindAllRoleFunctionsRepository,
  ) {}

  async execute(): Promise<RoleFunction[]> {
    const roleFunctions = await this.roleFunctionFinder.execute();
    return roleFunctions;
  }
} 