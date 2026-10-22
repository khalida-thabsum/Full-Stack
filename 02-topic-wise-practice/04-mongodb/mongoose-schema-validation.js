// Mongoose validation for a clinic: references between models, date rules,
// enum with custom message, a compound unique index to stop double-booking,
// getters/setters and query middleware.
const mongoose = require("mongoose");
const { Schema } = mongoose;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fsdPracticeKT";

const doctorSchema = new Schema({
  name: { type: String, required: true },
  speciality: { type: String, required: true, enum: { values: ["General", "Dermatology", "ENT", "Orthopaedics"], message: "{VALUE} is not a speciality at this clinic" } },
  fee: { type: Number, required: true, min: 100, get: v => `Rs ${v}` }, // getter changes how the fee is shown
  active: { type: Boolean, default: true }
}, { toJSON: { getters: true } });

// Query middleware: find() never returns inactive doctors unless asked
doctorSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeInactive !== true) this.where({ active: true });
  next();
});

const appointmentSchema = new Schema({
  doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  patientName: { type: String, required: true, set: v => v.trim().replace(/\s+/g, " ") }, // setter cleans spaces
  patientAge: { type: Number, required: true, min: [0, "Age cannot be negative"], max: [120, "Age looks wrong"] },
  phone: { type: String, required: true, validate: { validator: v => /^[6-9]\d{9}$/.test(v), message: "Phone must be a 10-digit mobile number" } },
  date: {
    type: Date,
    required: true,
    validate: [
      { validator: d => d > new Date(), message: "Appointment must be in the future" },
      { validator: d => d.getDay() !== 0, message: "Clinic is closed on Sundays" }
    ]
  },
  slot: { type: String, required: true, match: [/^(09|10|11|12|14|15|16):(00|30)$/, "Slot must be a half-hour between 09:00-12:30 or 14:00-16:30"] },
  reason: { type: String, maxlength: 200 }
});
// The same doctor cannot have two appointments in the same slot on the same day
appointmentSchema.index({ doctor: 1, date: 1, slot: 1 }, { unique: true });

// Async validator: the doctor must exist and be active
appointmentSchema.path("doctor").validate({
  validator: async id => !!(await mongoose.model("Doctor").findById(id)),
  message: "Doctor not found or not active"
});

const Doctor = mongoose.model("Doctor", doctorSchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);

function nextWeekday(daysAhead) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysAhead);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}
function nextSunday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return d;
}

async function book(label, data) {
  try {
    const a = await Appointment.create(data);
    console.log(`BOOKED   ${label}: ${a.patientName} at ${a.slot}`);
  } catch (err) {
    const why = err.errors ? Object.values(err.errors).map(e => e.message).join("; ") : err.code === 11000 ? "slot already taken" : err.message;
    console.log(`REJECTED ${label}: ${why}`);
  }
}

(async () => {
  await mongoose.connect(MONGO_URL);
  await Promise.all([Doctor.deleteMany({}), Appointment.deleteMany({})]);
  await Appointment.syncIndexes();

  const [gp, derm, retired] = await Doctor.create([
    { name: "Dr. Swathi", speciality: "General", fee: 300 },
    { name: "Dr. Kareem", speciality: "Dermatology", fee: 500 },
    { name: "Dr. Old", speciality: "ENT", fee: 400, active: false }
  ]);
  try { await Doctor.create({ name: "Dr. X", speciality: "Cardiology", fee: 50 }); }
  catch (err) { console.log("REJECTED doctor:", Object.values(err.errors).map(e => e.message).join("; ")); }

  const day = nextWeekday(3);
  await book("valid", { doctor: gp._id, patientName: "  Asha   Rani ", patientAge: 34, phone: "9876543210", date: day, slot: "10:30" });
  await book("same slot again", { doctor: gp._id, patientName: "Bala", patientAge: 40, phone: "9876500000", date: day, slot: "10:30" });
  await book("other doctor, same slot", { doctor: derm._id, patientName: "Bala", patientAge: 40, phone: "9876500000", date: day, slot: "10:30" });
  await book("in the past", { doctor: gp._id, patientName: "Chitra", patientAge: 22, phone: "9123456780", date: new Date("2025-01-01"), slot: "09:00" });
  await book("on a Sunday", { doctor: gp._id, patientName: "Dinesh", patientAge: 51, phone: "9123456781", date: nextSunday(), slot: "09:00" });
  await book("lunch-time slot", { doctor: gp._id, patientName: "Esha", patientAge: 29, phone: "9123456782", date: day, slot: "13:00" });
  await book("inactive doctor", { doctor: retired._id, patientName: "Farhan", patientAge: 60, phone: "9123456783", date: day, slot: "11:00" });
  await book("bad age and phone", { doctor: gp._id, patientName: "Gowri", patientAge: 150, phone: "12345", date: day, slot: "11:00" });

  console.log("\nActive doctors (query middleware hides Dr. Old):", (await Doctor.find()).map(d => `${d.name} ${d.fee}`));
  console.log("All doctors:", (await Doctor.find().setOptions({ includeInactive: true })).map(d => d.name));
  console.log("Appointments with doctor populated:", await Appointment.find().populate("doctor", "name speciality -_id").select("patientName slot -_id").lean());

  await mongoose.disconnect();
})().catch(err => { console.error("Could not run:", err.message); process.exit(1); });
