import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IFollowDocument extends Document {
  follower: Types.ObjectId;
  following: Types.ObjectId;
  createdAt: Date;
}

const FollowSchema = new Schema<IFollowDocument>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follower is required'],
      index: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Following is required'],
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Prevent duplicate follow records
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow: Model<IFollowDocument> =
  mongoose.models.Follow || mongoose.model<IFollowDocument>('Follow', FollowSchema);

export default Follow;
