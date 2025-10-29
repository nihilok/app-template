import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/infrastructure/database/client';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { GetUserUseCase } from '@/use-cases/user/get-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';
import { DeleteUserUseCase } from '@/use-cases/user/delete-user.use-case';
import { UpdateUserSchema } from '@/domain/user.types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRepository = new UserRepository(db);
    const getUserUseCase = new GetUserUseCase(userRepository);
    const user = await getUserUseCase.execute(id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate request body
    const validatedData = UpdateUserSchema.parse(body);
    
    // Execute use case
    const userRepository = new UserRepository(db);
    const updateUserUseCase = new UpdateUserUseCase(userRepository);
    const user = await updateUserUseCase.execute(id, validatedData);
    
    return NextResponse.json(user);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRepository = new UserRepository(db);
    const deleteUserUseCase = new DeleteUserUseCase(userRepository);
    const user = await deleteUserUseCase.execute(id);
    
    return NextResponse.json(user);
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
