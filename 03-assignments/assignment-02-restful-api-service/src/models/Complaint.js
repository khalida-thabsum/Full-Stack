const { Schema, model } = require('mongoose');

// A tiny counter collection gives every complaint the next ticket number,
// even if older complaints were deleted
const Counter = model('Counter', new Schema({ _id: String, seq: { type: Number, default: 0 } }));

const CATEGORIES = ['Electrical', 'Plumbing', 'Carpentry', 'Cleaning', 'Internet', 'Mess', 'Other'];
const STATUSES = ['Open', 'Assigned', 'InProgress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

// Hours allowed to resolve a complaint for each priority
const SLA_HOURS = { Low: 120, Medium: 72, High: 24, Urgent: 6 };

const commentSchema = new Schema(
  {
    by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const historySchema = new Schema(
  {
    from: String,
    to: String,
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const complaintSchema = new Schema(
  {
    ticketNo: { type: String, unique: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, minlength: [5, 'Title is too short'], maxlength: 120 },
    description: { type: String, required: [true, 'Description is required'], maxlength: 1000 },
    category: { type: String, required: true, enum: { values: CATEGORIES, message: 'Unknown category {VALUE}' } },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    status: { type: String, enum: STATUSES, default: 'Open' },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roomNo: { type: String, required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    dueBy: Date,
    resolvedAt: Date,
    rating: { type: Number, min: 1, max: 5 },
    comments: [commentSchema],
    history: [historySchema]
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

complaintSchema.virtual('isOverdue').get(function () {
  return !['Resolved', 'Closed'].includes(this.status) && this.dueBy && this.dueBy < new Date();
});

// Before the first save: create a ticket number and the due date
complaintSchema.pre('validate', async function (next) {
  if (this.isNew) {
    if (!this.ticketNo) {
      const year = new Date().getFullYear();
      const counter = await Counter.findOneAndUpdate({ _id: `ticket-${year}` }, { $inc: { seq: 1 } }, { new: true, upsert: true });
      this.ticketNo = `HC-${year}-${String(counter.seq).padStart(4, '0')}`;
    }
    this.dueBy = new Date(Date.now() + SLA_HOURS[this.priority || 'Medium'] * 3600 * 1000);
  }
  next();
});

module.exports = model('Complaint', complaintSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;
module.exports.SLA_HOURS = SLA_HOURS;
