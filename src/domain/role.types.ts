import { z } from 'zod';

export const CreateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  groupId: z.string().uuid('Invalid group ID'),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
});

export const AssignPermissionSchema = z.object({
  roleId: z.string().uuid('Invalid role ID'),
  permissionId: z.string().uuid('Invalid permission ID'),
});

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type AssignPermissionInput = z.infer<typeof AssignPermissionSchema>;

export interface IRoleDomain {
  id: string;
  name: string;
  description: string | null;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
