import { z } from 'zod';

export const CreatePermissionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  description: z.string().optional(),
});

export const UpdatePermissionSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
});

export type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof UpdatePermissionSchema>;

export interface IPermissionDomain {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
