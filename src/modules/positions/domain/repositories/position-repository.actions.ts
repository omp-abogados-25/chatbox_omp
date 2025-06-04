import { Position } from '../entities/position.entity';

// Datos de entrada para crear una posición (sin cambios)
export interface CreatePositionInput {
  name: string;
  description?: string | null;
}

// Datos de entrada para actualizar una posición (sin cambios)
export interface UpdatePositionInput {
  name?: string;
  description?: string | null;
}

// --- Clases Abstractas para cada Acción del Repositorio ---

export abstract class AbstractCreatePositionRepository {
  abstract execute(data: CreatePositionInput): Promise<Position>;
}

export abstract class AbstractFindAllPositionsRepository {
  abstract execute(): Promise<Position[]>;
}

export abstract class AbstractFindPositionByIdRepository {
  abstract execute(id: string): Promise<Position | null>;
}

export abstract class AbstractUpdatePositionRepository {
  abstract execute(id: string, data: UpdatePositionInput): Promise<Position | null>;
}

export abstract class AbstractDeletePositionRepository {
  abstract execute(id: string): Promise<Position | null>;
} 