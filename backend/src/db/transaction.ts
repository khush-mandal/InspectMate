import mongoose, { ClientSession } from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Helper to wrap database operations in a transaction.
 * @param operation The function containing operations to execute within the transaction.
 * @returns The result of the operation.
 */
export async function withTransaction<T>(
  operation: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  let result: T;

  try {
    session.startTransaction();
    result = await operation(session);
    await session.commitTransaction();
  } catch (error) {
    logger.error('Transaction failed, aborting...', error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return result;
}
