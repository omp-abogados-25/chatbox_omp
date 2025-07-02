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
export class PrismaCreateUserRepository implements AbstractCreateUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: CreateUserInput): Promise<User> {
    // Verificar si existe un usuario eliminado (is_active: false) con la misma cédula o email
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { identification_number: data.identification_number },
          { email: data.email }
        ],
        is_active: false // Solo buscar usuarios eliminados
      }
    });

    // Si existe un usuario eliminado, reactivarlo con los nuevos datos
    if (existingUser) {
      const updateData: any = {
        full_name: data.full_name,
        identification_number: data.identification_number,
        issuing_place: data.issuing_place,
        email: data.email,
        salary: data.salary,
        transportation_allowance: data.transportation_allowance,
        entry_date: data.entry_date,
        is_active: true, // Reactivar el usuario
      };

      // Agregar campos opcionales
      if (data.gender) {
        updateData.gender = data.gender;
      }
      if (data.can_login !== undefined) {
        updateData.can_login = data.can_login;
      }
      if (data.password) {
        updateData.password = data.password;
      }
      if (data.positionId !== undefined) {
        updateData.position = {
          connect: { id: data.positionId }
        };
      }

      const reactivatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: updateData
      });

      return toDomainEntity(reactivatedUser);
    }

    // Si no existe usuario eliminado, crear uno nuevo
    const createData: Prisma.UserCreateInput = {
      full_name: data.full_name,
      identification_number: data.identification_number,
      issuing_place: data.issuing_place,
      email: data.email,
      salary: data.salary,
      transportation_allowance: data.transportation_allowance,
      entry_date: data.entry_date,
    };
    
    // Agregar gender si se proporciona
    if (data.gender) {
      (createData as any).gender = data.gender;
    }

    // Agregar can_login si se proporciona
    if (data.can_login !== undefined) {
      (createData as any).can_login = data.can_login;
    }

    // Agregar password si se proporciona
    if (data.password) {
      (createData as any).password = data.password;
    }

    // is_active será true por defecto según el esquema
    
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