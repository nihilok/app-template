import { eq } from 'drizzle-orm';
import { BaseRepository } from '../database/base-repository';
import { users, User, NewUser } from '../database/schema/users';
import { Database } from '../database/client';

export class UserRepository extends BaseRepository<typeof users> {
  constructor(db: Database) {
    super(db, users);
  }

  async findByEmail(email: string, includeSoftDeleted = false): Promise<User | null> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const user = results[0];
    
    if (!includeSoftDeleted && user.deletedAt) {
      return null;
    }

    return user;
  }

  async createUser(data: NewUser): Promise<User> {
    return this.create(data);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return this.update(id, data);
  }

  async deleteUser(id: string): Promise<User | null> {
    return this.softDelete(id);
  }

  async restoreUser(id: string): Promise<User | null> {
    return this.restore(id);
  }
}
