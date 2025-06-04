import { Injectable } from '@nestjs/common';
import { Position as PrismaPosition } from '@prisma/client'; // Tipo de Prisma
import { PrismaService } from 'src/integrations/prisma'; // Inyectar el servicio Prisma
import { AbstractCreatePositionRepository, CreatePositionInput, Position } from '../../domain/repositories'; // Abstracción del Dominio y tipos

// Función de mapeo (puede ser global o repetida si es simple)
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
export class PrismaCreatePositionRepository implements AbstractCreatePositionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: CreatePositionInput): Promise<Position> {
    const prismaPosition = await this.prisma.position.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return toDomainEntity(prismaPosition);
  }
} 