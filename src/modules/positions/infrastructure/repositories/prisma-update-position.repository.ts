import { Injectable } from '@nestjs/common';
import { Position as PrismaPosition } from '@prisma/client';
import { AbstractUpdatePositionRepository, UpdatePositionInput, Position } from '../../domain/repositories';
import { PrismaService } from 'src/integrations/prisma';

function toDomainEntity(prismaPosition: PrismaPosition): Position {
  return {
    id: prismaPosition.id,
    name: prismaPosition.name,
    description: prismaPosition.description,
    created_at: prismaPosition.created_at,
    updated_at: prismaPosition.updated_at,
  };
}

@Injectable()
export class PrismaUpdatePositionRepository implements AbstractUpdatePositionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, data: UpdatePositionInput): Promise<Position | null> {
    try {
      const prismaPosition = await this.prisma.position.update({
        where: { id },
        data: {
          name: data.name, // Prisma maneja undefined para no actualizar
          description: data.description,
        },
      });
      return toDomainEntity(prismaPosition);
    } catch (error) {
      // Por ejemplo, si Prisma lanza un error porque el registro no existe (P2025)
      // En un caso real, podrías querer loggear el error o lanzar una excepción específica del dominio/aplicación
      // console.error(`Error updating position with ID ${id}:`, error);
      if (error.code === 'P2025') { // Código de error de Prisma para "Registro no encontrado"
        return null;
      }
      throw error; // Relanzar otros errores inesperados
    }
  }
} 