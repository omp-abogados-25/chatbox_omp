import { Module } from '@nestjs/common';
import {
  AbstractCreateRoleFunctionRepository,
  AbstractFindAllRoleFunctionsRepository,
  AbstractFindRoleFunctionByIdRepository,
  AbstractUpdateRoleFunctionRepository,
  AbstractDeleteRoleFunctionRepository,
} from '../../domain/repositories';
import { PrismaCreateRoleFunctionRepository, PrismaFindAllRoleFunctionsRepository, PrismaFindRoleFunctionByIdRepository, PrismaUpdateRoleFunctionRepository, PrismaDeleteRoleFunctionRepository } from '.';

@Module({
  providers: [
    {
      provide: AbstractCreateRoleFunctionRepository,
      useClass: PrismaCreateRoleFunctionRepository,
    },
    {
      provide: AbstractFindAllRoleFunctionsRepository,
      useClass: PrismaFindAllRoleFunctionsRepository,
    },
    {
      provide: AbstractFindRoleFunctionByIdRepository,
      useClass: PrismaFindRoleFunctionByIdRepository,
    },
    {
      provide: AbstractUpdateRoleFunctionRepository,
      useClass: PrismaUpdateRoleFunctionRepository,
    },
    {
      provide: AbstractDeleteRoleFunctionRepository,
      useClass: PrismaDeleteRoleFunctionRepository,
    },
  ],
  exports: [
    AbstractCreateRoleFunctionRepository,
    AbstractFindAllRoleFunctionsRepository,
    AbstractFindRoleFunctionByIdRepository,
    AbstractUpdateRoleFunctionRepository,
    AbstractDeleteRoleFunctionRepository,
  ],
})
export class RoleFunctionsRepositoriesModule {} 