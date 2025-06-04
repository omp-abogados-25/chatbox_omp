import { RoleFunction } from '../entities'; // Importa desde el index.ts de entities

// Datos de entrada para crear una función de rol
export interface CreateRoleFunctionInput {
  details: string;
  notes?: string | null;
}

// Datos de entrada para actualizar una función de rol
export interface UpdateRoleFunctionInput {
  details?: string;
  notes?: string | null;
}

// --- Clases Abstractas para cada Acción del Repositorio de RoleFunction ---

export abstract class AbstractCreateRoleFunctionRepository {
  abstract execute(data: CreateRoleFunctionInput): Promise<RoleFunction>;
}

export abstract class AbstractFindAllRoleFunctionsRepository {
  abstract execute(): Promise<RoleFunction[]>;
}

export abstract class AbstractFindRoleFunctionByIdRepository {
  abstract execute(id: string): Promise<RoleFunction | null>;
}

export abstract class AbstractUpdateRoleFunctionRepository {
  abstract execute(id: string, data: UpdateRoleFunctionInput): Promise<RoleFunction | null>;
}

export abstract class AbstractDeleteRoleFunctionRepository {
  abstract execute(id: string): Promise<RoleFunction | null>;
} 