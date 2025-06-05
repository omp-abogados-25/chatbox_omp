import { Module } from '@nestjs/common';
import {
  AbstractCreatePositionFunctionRepository,
  AbstractFindAllPositionFunctionsRepository,
  AbstractFindPositionFunctionByIdRepository,
  AbstractUpdatePositionFunctionRepository,
  AbstractDeletePositionFunctionRepository,
  AbstractFindFunctionDetailsByPositionIdRepository,
} from '../../domain/repositories';
import {
  PrismaCreatePositionFunctionRepository,
  PrismaFindAllPositionFunctionsRepository,
  PrismaFindPositionFunctionByIdRepository,
  PrismaUpdatePositionFunctionRepository,
  PrismaDeletePositionFunctionRepository,
  PrismaFindFunctionDetailsByPositionIdRepository,
} from '.';

@Module({
  providers: [
    {
      provide: AbstractCreatePositionFunctionRepository,
      useClass: PrismaCreatePositionFunctionRepository,
    },
    {
      provide: AbstractFindAllPositionFunctionsRepository,
      useClass: PrismaFindAllPositionFunctionsRepository,
    },
    {
      provide: AbstractFindPositionFunctionByIdRepository,
      useClass: PrismaFindPositionFunctionByIdRepository,
    },
    {
      provide: AbstractUpdatePositionFunctionRepository,
      useClass: PrismaUpdatePositionFunctionRepository,
    },
    {
      provide: AbstractDeletePositionFunctionRepository,
      useClass: PrismaDeletePositionFunctionRepository,
    },
    {
      provide: AbstractFindFunctionDetailsByPositionIdRepository,
      useClass: PrismaFindFunctionDetailsByPositionIdRepository,
    },
  ],
  exports: [
    AbstractCreatePositionFunctionRepository,
    AbstractFindAllPositionFunctionsRepository,
    AbstractFindPositionFunctionByIdRepository,
    AbstractUpdatePositionFunctionRepository,
    AbstractDeletePositionFunctionRepository,
    AbstractFindFunctionDetailsByPositionIdRepository,
  ],
})
export class PositionFunctionsRepositoriesModule {} 