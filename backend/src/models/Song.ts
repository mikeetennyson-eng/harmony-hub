import mongoose, { Document, Schema } from 'mongoose';

export interface ISong extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  artist: string;
  description: string;
  audioFile: string;
  previewUrl?: string;
  tags: string[];
  price: number;
  duration: number; // in seconds
  isSold: boolean;
  soldTo?: mongoose.Types.ObjectId[]; // users who purchased this song
  forSale: boolean; // whether this song should appear in marketplace
  createdAt: Date;
  updatedAt: Date;
}

const songSchema = new Schema<ISong>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  audioFile: {
    type: String,
    required: true
  },
  previewUrl: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  isSold: {
    type: Boolean,
    default: false
  },
  soldTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  forSale: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search
songSchema.index({ title: 'text', artist: 'text', tags: 'text' });

export default mongoose.model<ISong>('Song', songSchema);