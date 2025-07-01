import { User } from '../entities';

export abstract class AbstractFindUserByEmailRepository {
  abstract execute(email: string): Promise<User | null>;
} 