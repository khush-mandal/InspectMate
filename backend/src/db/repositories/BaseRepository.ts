import { Model, Document, FilterQuery, UpdateQuery, ClientSession } from 'mongoose';

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const doc = new this.model(data);
    return await doc.save({ session });
  }

  async findById(id: string, lean = true): Promise<T | null> {
    const query = this.model.findById(id);
    if (lean) query.lean();
    return query.exec() as Promise<T | null>;
  }

  async findOne(filter: FilterQuery<T>, lean = true): Promise<T | null> {
    const query = this.model.findOne(filter);
    if (lean) query.lean();
    return query.exec() as Promise<T | null>;
  }

  async find(
    filter: FilterQuery<T>,
    options: { page?: number; limit?: number; sort?: Record<string, 1 | -1> } = {},
    lean = true
  ): Promise<{ data: T[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.model.find(filter).skip(skip).limit(limit);
    if (options.sort) query.sort(options.sort);
    if (lean) query.lean();

    const [data, total] = await Promise.all([
      query.exec() as Promise<T[]>,
      this.model.countDocuments(filter).exec()
    ]);

    return { data, total };
  }

  async updateById(
    id: string,
    update: UpdateQuery<T>,
    session?: ClientSession
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      session
    }).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const doc = await this.model.exists(filter);
    return !!doc;
  }
}
