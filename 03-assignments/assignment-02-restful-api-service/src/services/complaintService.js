const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { HttpError } = require('../middleware/errorHandler');

// Which status can move to which, and who is allowed to make that move
const TRANSITIONS = {
  Open:       { Assigned: ['warden'] },
  Assigned:   { InProgress: ['staff'], Open: ['warden'] },
  InProgress: { Resolved: ['staff'] },
  Resolved:   { Closed: ['student'], Open: ['student'] }, // student confirms or reopens
  Closed:     {}
};

async function getComplaint(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Invalid complaint id');
  const complaint = await Complaint.findById(id);
  if (!complaint) throw new HttpError(404, 'Complaint not found');
  return complaint;
}

// Students may only see and act on their own complaints; staff only on ones assigned to them
function checkAccess(complaint, user) {
  if (user.role === 'student' && !complaint.raisedBy.equals(user._id)) {
    throw new HttpError(403, 'This complaint belongs to another student');
  }
  if (user.role === 'staff' && !(complaint.assignedTo && complaint.assignedTo.equals(user._id))) {
    throw new HttpError(403, 'This complaint is not assigned to you');
  }
}

function changeStatus(complaint, to, user) {
  const from = complaint.status;
  const allowedRoles = TRANSITIONS[from][to];
  if (!allowedRoles) throw new HttpError(409, `Cannot move a complaint from ${from} to ${to}`);
  if (!allowedRoles.includes(user.role)) throw new HttpError(403, `${user.role} cannot move a complaint from ${from} to ${to}`);
  complaint.status = to;
  complaint.history.push({ from, to, by: user._id });
}

async function create(data, student) {
  const complaint = new Complaint({
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    raisedBy: student._id,
    roomNo: student.roomNo
  });
  complaint.history.push({ from: null, to: 'Open', by: student._id });
  return complaint.save();
}

async function list(query, user) {
  const filter = {};
  if (user.role === 'student') filter.raisedBy = user._id;
  if (user.role === 'staff') filter.assignedTo = user._id;
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.priority) filter.priority = query.priority;
  if (query.overdue === 'true') {
    filter.status = { $nin: ['Resolved', 'Closed'] };
    filter.dueBy = { $lt: new Date() };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const sort = query.sort === 'oldest' ? { createdAt: 1 } : query.sort === 'due' ? { dueBy: 1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Complaint.find(filter).sort(sort).skip((page - 1) * limit).limit(limit)
      .select('-comments -history')
      .populate('assignedTo', 'name skill'),
    Complaint.countDocuments(filter)
  ]);
  return { page, limit, total, items };
}

async function getOne(id, user) {
  const complaint = await getComplaint(id);
  checkAccess(complaint, user);
  return complaint.populate([
    { path: 'raisedBy', select: 'name roomNo' },
    { path: 'assignedTo', select: 'name skill' },
    { path: 'comments.by', select: 'name role' }
  ]);
}

async function assign(id, staffId, warden) {
  const complaint = await getComplaint(id);
  if (!mongoose.isValidObjectId(staffId)) throw new HttpError(400, 'Invalid staffId');
  const staff = await User.findOne({ _id: staffId, role: 'staff' });
  if (!staff) throw new HttpError(404, 'Staff member not found');
  if (!['Other', 'Mess'].includes(complaint.category) && staff.skill !== complaint.category) {
    throw new HttpError(422, `${staff.name} handles ${staff.skill}, but this is a ${complaint.category} complaint`);
  }
  changeStatus(complaint, 'Assigned', warden);
  complaint.assignedTo = staff._id;
  return complaint.save();
}

async function updateStatus(id, to, user) {
  const complaint = await getComplaint(id);
  checkAccess(complaint, user);
  changeStatus(complaint, to, user);
  if (to === 'Resolved') complaint.resolvedAt = new Date();
  if (to === 'Open') {               // reopened or unassigned: start again
    complaint.assignedTo = null;
    complaint.resolvedAt = undefined;
  }
  return complaint.save();
}

async function addComment(id, text, user) {
  const complaint = await getComplaint(id);
  checkAccess(complaint, user);
  if (complaint.status === 'Closed') throw new HttpError(409, 'Closed complaints cannot get new comments');
  complaint.comments.push({ by: user._id, text });
  await complaint.save();
  return complaint.comments[complaint.comments.length - 1];
}

async function rate(id, rating, student) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'rating must be a whole number from 1 to 5');
  const complaint = await getComplaint(id);
  checkAccess(complaint, student);
  if (complaint.status !== 'Closed') throw new HttpError(409, 'You can rate a complaint only after closing it');
  if (complaint.rating) throw new HttpError(409, 'Already rated');
  complaint.rating = rating;
  return complaint.save();
}

async function remove(id, user) {
  const complaint = await getComplaint(id);
  checkAccess(complaint, user);
  if (complaint.status !== 'Open') throw new HttpError(409, 'Only complaints that are still Open can be withdrawn');
  await complaint.deleteOne();
}

// Dashboard numbers for the warden, built with aggregation
async function summary() {
  const [byStatus, byCategory, resolution, overdue] = await Promise.all([
    Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Complaint.aggregate([
      { $match: { resolvedAt: { $ne: null } } },
      { $group: {
          _id: null,
          avgHours: { $avg: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] } },
          avgRating: { $avg: '$rating' }
      } },
      { $project: { _id: 0, avgHours: { $round: ['$avgHours', 1] }, avgRating: { $round: ['$avgRating', 2] } } }
    ]),
    Complaint.countDocuments({ status: { $nin: ['Resolved', 'Closed'] }, dueBy: { $lt: new Date() } })
  ]);
  return { byStatus, byCategory, resolution: resolution[0] || { avgHours: null, avgRating: null }, overdue };
}

module.exports = { create, list, getOne, assign, updateStatus, addComment, rate, remove, summary, TRANSITIONS };
