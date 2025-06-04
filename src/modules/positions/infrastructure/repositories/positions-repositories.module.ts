import { Module } from '@nestjs/common';

// Importar las clases abstractas (tokens de inyección) del Dominio
import {
  AbstractCreatePositionRepository,
  AbstractFindAllPositionsRepository,
  AbstractFindPositionByIdRepository,
  AbstractUpdatePositionRepository,
  AbstractDeletePositionRepository,
} from '../../domain/repositories';

// Importar las implementaciones concretas de los repositorios
import { PrismaCreatePositionRepository } from './prisma-create-position.repository';
import { PrismaFindAllPositionsRepository } from './prisma-find-all-positions.repository';
import { PrismaFindPositionByIdRepository } from './prisma-find-position-by-id.repository';
import { PrismaUpdatePositionRepository } from './prisma-update-position.repository';
import { PrismaDeletePositionRepository } from './prisma-delete-position.repository';

@Module({
  providers: [
    {
      provide: AbstractCreatePositionRepository,
      useClass: PrismaCreatePositionRepository,
    },
    {
      provide: AbstractFindAllPositionsRepository,
      useClass: PrismaFindAllPositionsRepository,
    },
    {
      provide: AbstractFindPositionByIdRepository,
      useClass: PrismaFindPositionByIdRepository,
    },
    {
      provide: AbstractUpdatePositionRepository,
      useClass: PrismaUpdatePositionRepository,
    },
    {
      provide: AbstractDeletePositionRepository,
      useClass: PrismaDeletePositionRepository,
    },
  ],
  exports: [
    // Exportar los tokens para que puedan ser inyectados por otros módulos (ej. Casos de Uso)
    AbstractCreatePositionRepository,
    AbstractFindAllPositionsRepository,
    AbstractFindPositionByIdRepository,
    AbstractUpdatePositionRepository,
    AbstractDeletePositionRepository,
  ],
})
export class PositionsRepositoriesModule {} 