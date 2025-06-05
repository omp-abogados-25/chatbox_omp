import { Injectable } from '@nestjs/common';
import { User as PrismaUser, Prisma } from '@prisma/client';
import { AbstractCreateUserRepository, CreateUserInput, User } from '../../domain/repositories';
import { PrismaService } from 'src/integrations/prisma/prisma.service';

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
    positionId: prismaEntity.positionId ?? null, // Asegura null si es undefined en Prisma
    created_at: prismaEntity.created_at,
    updated_at: prismaEntity.updated_at,
  };
}

@Injectable()
export class PrismaCreateUserRepository implements AbstractCreateUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: CreateUserInput): Promise<User> {
    const createData: Prisma.UserCreateInput = {
      full_name: data.full_name,
      identification_number: data.identification_number,
      issuing_place: data.issuing_place,
      email: data.email,
      salary: data.salary,
      transportation_allowance: data.transportation_allowance,
      entry_date: data.entry_date,
    };
    if (data.positionId !== undefined) {
      createData.position = {
        connect: {
          id: data.positionId,
        },
      };
    }

    const prismaEntity = await this.prisma.user.create({ 
      data: createData 
    });
    return toDomainEntity(prismaEntity);
  }
} 