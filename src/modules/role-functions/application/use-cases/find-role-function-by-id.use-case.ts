import { AbstractFindRoleFunctionByIdRepository, RoleFunction } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class FindRoleFunctionByIdUseCase {
  constructor(
    @Inject(AbstractFindRoleFunctionByIdRepository)
    private readonly roleFunctionFinderById: AbstractFindRoleFunctionByIdRepository,
  ) {}

  async execute(id: string): Promise<RoleFunction | null> {
    const roleFunction = await this.roleFunctionFinderById.execute(id);
    if (!roleFunction) {
      return null;
    }
    return roleFunction;
  }
} 