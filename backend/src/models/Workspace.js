const mongoose = require('mongoose');

const WorkspaceMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'viewer' },
    status: { type: String, enum: ['active', 'invited'], default: 'invited' },
    invitedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const WorkspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [WorkspaceMemberSchema], default: [] },
  },
  { timestamps: true }
);

WorkspaceSchema.index({ ownerId: 1 }, { unique: true });
WorkspaceSchema.index({ ownerId: 1, name: 1 });

module.exports = mongoose.model('Workspace', WorkspaceSchema);

