import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/integrations/prisma';
import { User as PrismaUser, Prisma } from '@prisma/client';
import { AbstractUpdateUserRepository, UpdateUserInput, User } from '../../domain/repositories';

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

@Injectable()
export class PrismaUpdateUserRepository implements AbstractUpdateUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, data: UpdateUserInput): Promise<User | null> {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.full_name !== undefined) {
      updateData.full_name = data.full_name;
    }
    if (data.identification_number !== undefined) {
      updateData.identification_number = data.identification_number;
    }
    if (data.issuing_place !== undefined) {
      updateData.issuing_place = data.issuing_place;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.entry_date !== undefined) {
      updateData.entry_date = data.entry_date;
    }
    if (data.salary !== undefined) {
      updateData.salary = data.salary;
    }
    if (data.transportation_allowance !== undefined) {
      updateData.transportation_allowance = data.transportation_allowance;
    }
    if (data.gender !== undefined) {
      (updateData as any).gender = data.gender;
    }
    if (data.can_login !== undefined) {
      (updateData as any).can_login = data.can_login;
    }
    if (data.password !== undefined) {
      (updateData as any).password = data.password;
    }
    if (data.positionId !== undefined) {
      updateData.position = {
        connect: {
          id: data.positionId,
        },
      };
    }

    try {
      const prismaEntity = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
      return toDomainEntity(prismaEntity);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
} 