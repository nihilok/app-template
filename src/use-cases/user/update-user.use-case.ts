import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { UpdateUserInput, UpdateUserSchema } from '@/domain/user.types';
import { User } from '@/infrastructure/database/schema/users';

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string, input: UpdateUserInput): Promise<User | null> {
    // Validate input
    const validatedData = UpdateUserSchema.parse(input);

    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Update user
    const updatedUser = await this.userRepository.updateUser(id, validatedData);
    return updatedUser;
  }
}
