import { Injectable } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';
import { AbstractFindUserByIdRepository, User } from '../../domain/repositories';
import { PrismaService } from 'src/integrations/prisma';

// Función auxiliar para mapear la entidad de Prisma User a la entidad de Dominio User
function toDomainEntity(prismaEntity: PrismaUser): User {
  if (!prismaEntity) return null;
  return {
    id: prismaEntity.id,
    full_name: prismaEntity.full_name,
    identification_number: prismaEntity.identification_number,
    issuing_place: prismaEntity.issuing_place,
    email: prismaEntity.email,
    salary: String(prismaEntity.salary),
    transportation_allowance: String(prismaEntity.transportation_allowance),
    gender: (prismaEntity as any).gender,
    can_login: (prismaEntity as any).can_login || false,
    password: (prismaEntity as any).password || null,
    is_active: (prismaEntity as any).is_active !== undefined ? (prismaEntity as any).is_active : true,
    positionId: prismaEntity.positionId ?? null,
    created_at: prismaEntity.created_at,
    updated_at: prismaEntity.updated_at,
    entry_date: prismaEntity.entry_date ? prismaEntity.entry_date : String(prismaEntity.entry_date),
  };
}

@Injectable()
export class PrismaFindUserByIdRepository implements AbstractFindUserByIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string): Promise<User | null> {
    // Buscar solo usuarios activos por defecto
    const prismaEntity = await this.prisma.user.findFirst({
      where: { 
        id,
        is_active: true
      },
    });
    return toDomainEntity(prismaEntity);
  }
} 