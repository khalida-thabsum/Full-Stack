require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Complaint = require('../src/models/Complaint');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostelComplaints');
  await Promise.all([User.deleteMany({}), Complaint.deleteMany({})]);

  const users = await User.create([
    { name: 'Khalida Thabsum', role: 'student', email: 'khalida@example.com', roomNo: 'B-214' },
    { name: 'Nikhitha', role: 'student', email: 'nikhitha@example.com', roomNo: 'B-118' },
    { name: 'Mr. Prasad', role: 'warden', email: 'warden@example.com' },
    { name: 'Ramesh', role: 'staff', email: 'ramesh@example.com', skill: 'Electrical' },
    { name: 'Suresh', role: 'staff', email: 'suresh@example.com', skill: 'Plumbing' },
    { name: 'Anil', role: 'staff', email: 'anil@example.com', skill: 'Internet' }
  ]);

  console.log('Seeded users. Use these ids in the X-User-Id header:');
  users.forEach(u => console.log(`  ${u.role.padEnd(8)} ${u.name.padEnd(16)} ${u._id}`));
  await mongoose.disconnect();
})();
