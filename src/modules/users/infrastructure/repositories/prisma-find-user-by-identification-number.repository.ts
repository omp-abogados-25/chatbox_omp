import { Injectable } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';
import { AbstractFindUserByIdentificationNumberRepository, User } from '../../domain/repositories';
import { PrismaService } from 'src/integrations/prisma'; // Asumiendo alias de ruta 'src/*'

// Función para mapear la entidad User de Prisma a la entidad User del Dominio
// Copiada y adaptada de prisma-find-user-by-id.repository.ts
function toDomainEntity(prismaEntity: PrismaUser | null): User | null {
  if (!prismaEntity) return null;
  return {
    id: prismaEntity.id,
    full_name: prismaEntity.full_name,
    identification_number: prismaEntity.identification_number,
    issuing_place: prismaEntity.issuing_place,
    email: prismaEntity.email,
    salary: String(prismaEntity.salary), // El esquema de Prisma usa String para salary
    transportation_allowance: String(prismaEntity.transportation_allowance), // El esquema de Prisma usa String para transportation_allowance
    positionId: prismaEntity.positionId ?? null,
    created_at: prismaEntity.created_at,
    updated_at: prismaEntity.updated_at,
    entry_date: prismaEntity.entry_date, // El esquema de Prisma usa String para entry_date
  };
}

@Injectable()
export class PrismaFindUserByIdentificationNumberRepository implements AbstractFindUserByIdentificationNumberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(identificationNumber: string): Promise<User | null> {
    // Normalizar el número de identificación de entrada (quitar puntos)
    const normalizedIdentificationNumber = identificationNumber.replace(/\./g, '');

    const prismaEntity = await this.prisma.user.findUnique({
      where: { identification_number: normalizedIdentificationNumber }, // Buscar con el número normalizado
    });
    return toDomainEntity(prismaEntity);
  }
} 