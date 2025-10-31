import { NextRequest, NextResponse } from 'next/server';
import { UserController } from '@/controllers';
import { CreateUserSchema } from '@/domain/user.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = CreateUserSchema.parse(body);
    
    // Execute via controller
    const controller = new UserController();
    const user = await controller.createUser(validatedData);
    
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
    const controller = new UserController();
    const users = await controller.getAllUsers();
    
    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
