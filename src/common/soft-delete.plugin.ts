import { Schema } from 'mongoose';

export interface SoftDeletable {
  deletedAt?: Date;
  isDeleted: boolean;
}

export function addSoftDeletePlugin(schema: Schema) {
  // Add deletedAt field
  schema.add({
    deletedAt: {
      type: Date,
      default: null,
    },
  });

  // Add virtual for isDeleted
  schema.virtual('isDeleted').get(function () {
    return this.deletedAt !== null && this.deletedAt !== undefined;
  });

  // Modify find queries to exclude soft-deleted documents
  schema.pre(/^find/, function (this: any) {
    if (!this.getOptions().withDeleted) {
      this.where({ deletedAt: null });
    }
  });

  // Add soft delete method
  schema.methods.softDelete = async function () {
    this.deletedAt = new Date();
    return this.save();
  };

  // Add restore method
  schema.methods.restore = async function () {
    this.deletedAt = null;
    return this.save();
  };

  // Override remove to do soft delete by default
  schema.methods.remove = async function (hardDelete = false) {
    if (hardDelete) {
      return this.deleteOne();
    }
    return this.softDelete();
  };
}
