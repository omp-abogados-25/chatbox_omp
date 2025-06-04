import { AbstractDeleteRoleFunctionRepository, RoleFunction } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class DeleteRoleFunctionUseCase {
  constructor(
    @Inject(AbstractDeleteRoleFunctionRepository)
    private readonly roleFunctionDeleter: AbstractDeleteRoleFunctionRepository,
  ) {}

  async execute(id: string): Promise<RoleFunction | null> {
    const roleFunction = await this.roleFunctionDeleter.execute(id);
    if (!roleFunction) {
      return null;
    }
    return roleFunction;
  }
} 