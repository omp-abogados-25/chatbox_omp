import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/integrations/prisma';
import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';

// Función auxiliar para mapear la entidad de Prisma User a la entidad de Dominio User
function toDomainEntity(prismaEntity: PrismaUser): User {
  if (!prismaEntity) return null;
  return {
    id: prismaEntity.id,
    full_name: prismaEntity.full_name,
    identification_number: prismaEntity.identification_number,
    issuing_place: prismaEntity.issuing_place,
    email: prismaEntity.email,
    entry_date: prismaEntity.entry_date ? prismaEntity.entry_date : String(prismaEntity.entry_date),
    salary: String(prismaEntity.salary),
    transportation_allowance: String(prismaEntity.transportation_allowance),
    gender: (prismaEntity as any).gender,
    can_login: (prismaEntity as any).can_login || false,
    password: (prismaEntity as any).password || null,
    is_active: (prismaEntity as any).is_active !== undefined ? (prismaEntity as any).is_active : true,
    positionId: prismaEntity.positionId ?? null,
    created_at: prismaEntity.created_at,
    updated_at: prismaEntity.updated_at,
  };
}

export interface IFindAllUsersIncludingDeletedRepository {
  execute(): Promise<User[]>;
}

@Injectable()
export class PrismaFindAllUsersIncludingDeletedRepository implements IFindAllUsersIncludingDeletedRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<User[]> {
    // Obtener TODOS los usuarios (activos e inactivos) para administradores
    const prismaEntities = await this.prisma.user.findMany({
      orderBy: [
        { is_active: 'desc' }, // Usuarios activos primero
        { created_at: 'desc' }  // Más recientes primero
      ]
    });
    return prismaEntities.map(toDomainEntity);
  }
} 