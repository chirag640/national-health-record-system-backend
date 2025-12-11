import { Model, Document, ClientSession, Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Base repository with transaction support
 * Provides common database operations with MongoDB session management
 */
@Injectable()
export abstract class BaseRepository<T extends Document> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly model: Model<T>,
    @InjectConnection() protected readonly connection: Connection,
  ) {}

  /**
   * Execute multiple operations within a transaction
   * Automatically handles commit/rollback
   *
   * @example
   * await repository.withTransaction(async (session) => {
   *   await this.model.create([data], { session });
   *   await relatedModel.updateOne({ ... }, { session });
   * });
   */
  async withTransaction<R>(callback: (session: ClientSession) => Promise<R>): Promise<R> {
    const session = await this.connection.startSession();

    try {
      let result: R;

      await session.withTransaction(async () => {
        result = await callback(session);
      });

      this.logger.log('Transaction completed successfully');
      return result!;
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Transaction failed: ${err.message}`, err.stack);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Create a document with transaction support
   */
  async createWithTransaction(data: Partial<T>, session?: ClientSession): Promise<T> {
    const [created] = await this.model.create([data], { session });
    return created as T;
  }

  /**
   * Update a document with transaction support
   */
  async updateWithTransaction(
    id: string,
    data: Partial<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, { $set: data }, { new: true, session }).exec();
  }

  /**
   * Delete a document with transaction support
   */
  async deleteWithTransaction(id: string, session?: ClientSession): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id, { session }).exec();
    return !!result;
  }

  /**
   * Check if document exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.model.countDocuments({ _id: id }).exec();
    return count > 0;
  }

  /**
   * Bulk create with transaction support
   */
  async bulkCreateWithTransaction(dataArray: Partial<T>[], session?: ClientSession): Promise<T[]> {
    return this.model.create(dataArray, { session });
  }

  /**
   * Create a document
   */
  async create(data: Partial<T>): Promise<T> {
    const created = await this.model.create(data);
    return created as T;
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  /**
   * Find one document by query
   */
  async findOne(query: any): Promise<T | null> {
    return this.model.findOne(query).exec();
  }

  /**
   * Find all documents
   */
  async findAll(query: any = {}): Promise<T[]> {
    return this.model.find(query).exec();
  }

  /**
   * Update document by ID
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  /**
   * Delete document by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  /**
   * Soft delete document by ID
   */
  async softDelete(id: string): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();
  }

  /**
   * Count documents
   */
  async count(query: any = {}): Promise<number> {
    return this.model.countDocuments(query).exec();
  }
}
