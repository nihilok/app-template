import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { User } from '@/infrastructure/database/schema/users';

export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<User | null> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Soft delete user
    const deletedUser = await this.userRepository.deleteUser(id);
    return deletedUser;
  }
}
