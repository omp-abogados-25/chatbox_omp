import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/integrations/prisma';
import { User as PrismaUser, Prisma } from '@prisma/client';
import { AbstractDeleteUserRepository, User } from '../../domain/repositories';

// Función auxiliar para mapear la entidad de Prisma User a la entidad de Dominio User
function toDomainEntity(prismaEntity: PrismaUser): User {
  if (!prismaEntity) return null;
  return {
    id: prismaEntity.id,
    full_name: prismaEntity.full_name,
    identification_number: prismaEntity.identification_number,
    issuing_place: prismaEntity.issuing_place,
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
    email: prismaEntity.email,
  };
}

@Injectable()
export class PrismaDeleteUserRepository implements AbstractDeleteUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string): Promise<User | null> {
    try {
      // Soft delete: marcar como inactivo en lugar de eliminar completamente
      const prismaEntity = await this.prisma.user.update({
        where: { 
          id,
          is_active: true // Solo "eliminar" usuarios que están activos
        },
        data: {
          is_active: false,
          can_login: false, // También deshabilitar login por seguridad
          password: null,   // Limpiar contraseña por seguridad
        },
      });
      return toDomainEntity(prismaEntity);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null; // Usuario no encontrado o ya eliminado
      }
      throw error;
    }
  }
} 