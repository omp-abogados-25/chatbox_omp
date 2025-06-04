import { Injectable } from '@nestjs/common';
import { Position as PrismaPosition } from '@prisma/client';
import { PrismaService } from 'src/integrations/prisma';
import { AbstractDeletePositionRepository, Position } from '../../domain/repositories';

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
export class PrismaDeletePositionRepository implements AbstractDeletePositionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string): Promise<Position | null> {
    try {
      const prismaPosition = await this.prisma.position.delete({
        where: { id },
      });
      return toDomainEntity(prismaPosition);
    } catch (error) {
      if (error.code === 'P2025') { // Código de error de Prisma para "Registro no encontrado"
        return null;
      }
      throw error; // Relanzar otros errores inesperados
    }
  }
} 