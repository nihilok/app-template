import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infrastructure/database/client';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';
import { CreateUserSchema } from '@/domain/user.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = CreateUserSchema.parse(body);
    
    // Execute use case
    const userRepository = new UserRepository(db);
    const createUserUseCase = new CreateUserUseCase(userRepository);
    const user = await createUserUseCase.execute(validatedData);
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const userRepository = new UserRepository(db);
    const users = await userRepository.findAll();
    
    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
