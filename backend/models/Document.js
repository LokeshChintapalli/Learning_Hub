import mongoose from 'mongoose';

const ChunkSchema = new mongoose.Schema({
  text: String,
  index: Number
});

const DocumentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  uploadedAt: { type: Date, default: Date.now },
  fullText: String,        // full extracted text
  chunks: [ChunkSchema],   // text chunks
  summary: String          // combined summary
});

export default mongoose.model('Document', DocumentSchema);
