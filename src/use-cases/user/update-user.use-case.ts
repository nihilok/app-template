import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { UpdateUserInput } from '@/domain/user.types';
import { User } from '@/infrastructure/database/schema/users';

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string, input: UpdateUserInput): Promise<User | null> {
    // Check if user exists (business rule)
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Update user
    const updatedUser = await this.userRepository.updateUser(id, input);
    return updatedUser;
  }
}
