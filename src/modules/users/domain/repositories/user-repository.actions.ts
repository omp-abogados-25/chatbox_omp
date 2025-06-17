import { User } from '../entities';

export interface CreateUserInput {
  full_name: string;
  identification_number: string;
  issuing_place: string;
  email: string;
  entry_date: string;
  salary: string;
  transportation_allowance: string;
  gender?: string;
  positionId?: string | null;
}

export interface UpdateUserInput {
  full_name?: string;
  identification_number?: string;
  issuing_place?: string;
  email?: string;
  entry_date?: string;
  salary?: string;
  transportation_allowance?: string;
  gender?: string;
  positionId?: string | null;
}

export abstract class AbstractCreateUserRepository {
  abstract execute(data: CreateUserInput): Promise<User>;
}

export abstract class AbstractFindAllUsersRepository {
  abstract execute(): Promise<User[]>;
}

export abstract class AbstractFindUserByIdRepository {
  abstract execute(id: string): Promise<User | null>;
}

export abstract class AbstractFindUserByIdentificationNumberRepository {
  abstract execute(identificationNumber: string): Promise<User | null>;
}

export abstract class AbstractUpdateUserRepository {
  abstract execute(id: string, data: UpdateUserInput): Promise<User | null>;
}

export abstract class AbstractDeleteUserRepository {
  abstract execute(id: string): Promise<User | null>;
} 