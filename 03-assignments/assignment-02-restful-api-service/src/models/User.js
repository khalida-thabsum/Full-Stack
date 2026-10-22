const { Schema, model } = require('mongoose');

// Students raise complaints, the warden assigns them, staff fix them
const userSchema = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    role: { type: String, required: true, enum: ['student', 'warden', 'staff'] },
    email: { type: String, required: true, unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
    roomNo: {
      type: String,
      // Only students need a room number, e.g. B-214
      required: [function () { return this.role === 'student'; }, 'Students must have a room number'],
      match: [/^[A-D]-\d{3}$/, 'Room number looks like B-214']
    },
    skill: {
      type: String,
      enum: ['Electrical', 'Plumbing', 'Carpentry', 'Cleaning', 'Internet'],
      required: [function () { return this.role === 'staff'; }, 'Staff must have a skill']
    }
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
