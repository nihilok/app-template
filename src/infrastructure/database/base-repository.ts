import { eq, isNull } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { Database } from './client';

export interface SoftDeletable {
  deletedAt: Date | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export class BaseRepository<T extends PgTable & { id: any; deletedAt: any; updatedAt: any }> {
  constructor(
    protected readonly db: Database,
    protected readonly table: T
  ) {}

  /**
   * Find all records (excluding soft-deleted by default)
   */
  async findAll(includeSoftDeleted = false): Promise<any[]> {
    const query = this.db.select().from(this.table);
    
    if (!includeSoftDeleted) {
      return query.where(isNull(this.table.deletedAt));
    }
    
    return query;
  }

  /**
   * Find by ID (excluding soft-deleted by default)
   */
  async findById(id: string | number, includeSoftDeleted = false): Promise<any | null> {
    const query = this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);

    const results = await query;
    
    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    
    if (!includeSoftDeleted && result.deletedAt) {
      return null;
    }

    return result;
  }

  /**
   * Create a new record
   */
  async create(data: any): Promise<any> {
    const result = await this.db
      .insert(this.table)
      .values(data)
      .returning();
    
    return result[0];
  }

  /**
   * Update a record
   */
  async update(id: string | number, data: any): Promise<any | null> {
    const result = await this.db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(this.table.id, id))
      .returning();
    
    return result[0] || null;
  }

  /**
   * Soft delete a record
   */
  async softDelete(id: string | number): Promise<any | null> {
    const result = await this.db
      .update(this.table)
      .set({ deletedAt: new Date(), updatedAt: new Date() } as any)
      .where(eq(this.table.id, id))
      .returning();
    
    return result[0] || null;
  }

  /**
   * Hard delete a record (permanent)
   */
  async hardDelete(id: string | number): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Restore a soft-deleted record
   */
  async restore(id: string | number): Promise<any | null> {
    const result = await this.db
      .update(this.table)
      .set({ deletedAt: null, updatedAt: new Date() } as any)
      .where(eq(this.table.id, id))
      .returning();
    
    return result[0] || null;
  }
}
