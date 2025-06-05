import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/integrations/prisma';
import { User as PrismaUser } from '@prisma/client';
import { AbstractFindAllUsersRepository, User } from '../../domain/repositories';

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
    positionId: prismaEntity.positionId ?? null,
    created_at: prismaEntity.created_at,
    updated_at: prismaEntity.updated_at,
  };
}

@Injectable()
export class PrismaFindAllUsersRepository implements AbstractFindAllUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<User[]> {
    const prismaEntities = await this.prisma.user.findMany();
    return prismaEntities.map(toDomainEntity);
  }
} 