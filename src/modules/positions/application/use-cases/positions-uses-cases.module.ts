import { Module } from '@nestjs/common';
import { PositionsInfrastructureModule } from '../../infrastructure'; // Ajustar ruta si es necesario
import { CreatePositionUseCase, FindAllPositionsUseCase, FindPositionByIdUseCase, UpdatePositionUseCase, DeletePositionUseCase } from './index';

const useCases = [
  CreatePositionUseCase,
  FindAllPositionsUseCase,
  FindPositionByIdUseCase,
  UpdatePositionUseCase,
  DeletePositionUseCase,
]
@Module({
  imports: [PositionsInfrastructureModule],
  providers: useCases,
  exports: useCases,
})
export class PositionsUsesCasesModule {}