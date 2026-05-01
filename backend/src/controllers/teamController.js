const Workspace = require('../models/Workspace');
const { sendApiError } = require('../utils/apiError');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function getWorkspace(req, res, next) {
  try {
    const workspace = await Workspace.findOne({ ownerId: req.user.id }).lean();
    res.json({ success: true, data: workspace || null });
  } catch (err) {
    next(err);
  }
}

async function createWorkspace(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      return sendApiError(res, 400, 'Workspace name is required', 'VALIDATION_ERROR');
    }

    const existing = await Workspace.findOne({ ownerId: req.user.id }).lean();
    if (existing) {
      return sendApiError(res, 409, 'Workspace already exists for this owner', 'CONFLICT');
    }

    const workspace = await Workspace.create({
      name,
      ownerId: req.user.id,
      members: [{ userId: req.user.id, email: normalizeEmail(req.user.email), role: 'owner', status: 'active' }],
    });

    res.status(201).json({ success: true, data: workspace });
  } catch (err) {
    if (err?.code === 11000) {
      return sendApiError(res, 409, 'Workspace already exists for this owner', 'CONFLICT');
    }
    next(err);
  }
}

async function inviteMember(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const role = String(req.body.role || 'viewer');
    if (!email) {
      return sendApiError(res, 400, 'email is required', 'VALIDATION_ERROR');
    }

    const workspace = await Workspace.findOne({ ownerId: req.user.id });
    if (!workspace) {
      return sendApiError(res, 404, 'Workspace not found', 'NOT_FOUND');
    }

    if (workspace.members.some((m) => m.email === email)) {
      return sendApiError(res, 409, 'Member already exists', 'CONFLICT');
    }

    workspace.members.push({ email, role, status: 'invited' });
    await workspace.save();

    res.status(201).json({ success: true, data: workspace });
  } catch (err) {
    if (err?.code === 11000) {
      return sendApiError(res, 409, 'Workspace already exists for this owner', 'CONFLICT');
    }
    next(err);
  }
}

async function updateMember(req, res, next) {
  try {
    const email = normalizeEmail(req.params.email);
    const role = String(req.body.role || '');
    if (!role) {
      return sendApiError(res, 400, 'role is required', 'VALIDATION_ERROR');
    }

    const workspace = await Workspace.findOne({ ownerId: req.user.id });
    if (!workspace) {
      return sendApiError(res, 404, 'Workspace not found', 'NOT_FOUND');
    }

    const member = workspace.members.find((m) => m.email === email);
    if (!member) {
      return sendApiError(res, 404, 'Member not found', 'NOT_FOUND');
    }
    if (member.role === 'owner') {
      return sendApiError(res, 400, 'Owner role cannot be changed', 'VALIDATION_ERROR');
    }

    member.role = role;
    await workspace.save();

    res.json({ success: true, data: workspace });
  } catch (err) {
    next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const email = normalizeEmail(req.params.email);
    const workspace = await Workspace.findOne({ ownerId: req.user.id });
    if (!workspace) {
      return sendApiError(res, 404, 'Workspace not found', 'NOT_FOUND');
    }

    workspace.members = workspace.members.filter((m) => m.email !== email || m.role === 'owner');
    await workspace.save();

    res.json({ success: true, data: workspace });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWorkspace,
  createWorkspace,
  inviteMember,
  updateMember,
  removeMember,
};




