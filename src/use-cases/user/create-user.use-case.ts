import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { CreateUserInput } from '@/domain/user.types';
import { User } from '@/infrastructure/database/schema/users';

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    // Check if user already exists (business rule)
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user
    const user = await this.userRepository.createUser({
      email: input.email,
      name: input.name || null,
      image: input.image || null,
    });

    return user;
  }
}
