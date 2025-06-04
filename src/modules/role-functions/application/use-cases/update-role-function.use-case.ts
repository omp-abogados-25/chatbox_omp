import { AbstractUpdateRoleFunctionRepository, UpdateRoleFunctionInput, RoleFunction } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class UpdateRoleFunctionUseCase {
  constructor(
    @Inject(AbstractUpdateRoleFunctionRepository)
    private readonly roleFunctionUpdater: AbstractUpdateRoleFunctionRepository,
  ) {}

  async execute(id: string, data: UpdateRoleFunctionInput): Promise<RoleFunction | null> {
    const roleFunction = await this.roleFunctionUpdater.execute(id, data);
    if (!roleFunction) {
      return null;
    }
    return roleFunction;
  }
} 