import { NextRequest, NextResponse } from 'next/server';
import { UserController } from '@/controllers';
import { CreateUserSchema } from '@/domain/user.types';
import { requireAuth } from '@/lib/auth/helpers';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const actorId = await requireAuth();
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = CreateUserSchema.parse(body);
    
    // Execute via controller (includes permission check)
    const controller = new UserController();
    const user = await controller.createUser(actorId, validatedData);
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
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
    // Authenticate user
    const actorId = await requireAuth();
    
    const controller = new UserController();
    const users = await controller.getAllUsers(actorId);
    
    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
