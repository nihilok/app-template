import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { User } from '@/infrastructure/database/schema/users';

export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    return user;
  }

  async getByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    return user;
  }
}
