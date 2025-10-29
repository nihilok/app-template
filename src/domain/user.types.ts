import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').optional(),
  image: z.string().url('Invalid image URL').optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  image: z.string().url('Invalid image URL').optional(),
  emailVerified: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export interface IUserDomain {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
