import { AbstractCreateRoleFunctionRepository, CreateRoleFunctionInput, RoleFunction } from '../../domain/repositories';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class CreateRoleFunctionUseCase {
  constructor(
    @Inject(AbstractCreateRoleFunctionRepository)
    private readonly roleFunctionCreator: AbstractCreateRoleFunctionRepository,
  ) {}

  async execute(data: CreateRoleFunctionInput): Promise<RoleFunction> {
    const roleFunction = await this.roleFunctionCreator.execute(data);
    return roleFunction;
  }
} 