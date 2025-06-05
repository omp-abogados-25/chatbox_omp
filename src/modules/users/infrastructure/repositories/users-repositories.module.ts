import { Module } from '@nestjs/common';
// Asumimos que PrismaService es provisto globalmente o por un PrismaModule importado en AppModule
// import { PrismaModule } from 'src/database/prisma.module'; // Ejemplo de importación de PrismaModule
import {
  AbstractCreateUserRepository,
  AbstractFindAllUsersRepository,
  AbstractFindUserByIdRepository,
  AbstractUpdateUserRepository,
  AbstractDeleteUserRepository,
  AbstractFindUserByIdentificationNumberRepository,
} from '../../domain/repositories';
import {
  PrismaCreateUserRepository,
  PrismaFindAllUsersRepository,
  PrismaFindUserByIdRepository,
  PrismaUpdateUserRepository,
  PrismaDeleteUserRepository,
  PrismaFindUserByIdentificationNumberRepository,
} from '.';
@Module({
  providers: [
    {
      provide: AbstractCreateUserRepository,
      useClass: PrismaCreateUserRepository,
    },
    {
      provide: AbstractFindAllUsersRepository,
      useClass: PrismaFindAllUsersRepository,
    },
    {
      provide: AbstractFindUserByIdRepository,
      useClass: PrismaFindUserByIdRepository,
    },
    {
      provide: AbstractFindUserByIdentificationNumberRepository,
      useClass: PrismaFindUserByIdentificationNumberRepository,
    },
    {
      provide: AbstractUpdateUserRepository,
      useClass: PrismaUpdateUserRepository,
    },
    {
      provide: AbstractDeleteUserRepository,
      useClass: PrismaDeleteUserRepository,
    },
  ],
  exports: [
    AbstractCreateUserRepository,
    AbstractFindAllUsersRepository,
    AbstractFindUserByIdRepository,
    AbstractFindUserByIdentificationNumberRepository,
    AbstractUpdateUserRepository,
    AbstractDeleteUserRepository,
  ],
})
export class UsersRepositoriesModule {} 