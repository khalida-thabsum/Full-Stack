// Aggregation on inter-college cricket stats: $match, $group, $project, $sort, $limit,
// $unwind, $lookup, $addFields, $switch, $sortByCount and $out
const mongoose = require("mongoose");
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/fsdPracticeKT";

const Team = mongoose.model("Team", new mongoose.Schema({ code: String, college: String }));
const Innings = mongoose.model("Innings", new mongoose.Schema({
  player: String, team: String, match: Number, runs: Number, balls: Number, fours: Number, sixes: Number, out: Boolean
}), "innings");

const teams = [
  { code: "ANT", college: "ANITS" }, { code: "GIT", college: "GITAM" }, { code: "AU", college: "Andhra University" }
];
const innings = [
  { player: "Kiran", team: "ANT", match: 1, runs: 54, balls: 38, fours: 6, sixes: 2, out: true },
  { player: "Kiran", team: "ANT", match: 2, runs: 12, balls: 15, fours: 1, sixes: 0, out: true },
  { player: "Kiran", team: "ANT", match: 3, runs: 77, balls: 49, fours: 8, sixes: 3, out: false },
  { player: "Rahul", team: "GIT", match: 1, runs: 33, balls: 30, fours: 4, sixes: 0, out: true },
  { player: "Rahul", team: "GIT", match: 2, runs: 101, balls: 64, fours: 11, sixes: 4, out: true },
  { player: "Sana",  team: "ANT", match: 1, runs: 8,  balls: 11, fours: 1, sixes: 0, out: true },
  { player: "Sana",  team: "ANT", match: 2, runs: 45, balls: 27, fours: 5, sixes: 2, out: true },
  { player: "Vamsi", team: "AU",  match: 1, runs: 0,  balls: 3,  fours: 0, sixes: 0, out: true },
  { player: "Vamsi", team: "AU",  match: 2, runs: 61, balls: 52, fours: 7, sixes: 1, out: false },
  { player: "Teja",  team: "GIT", match: 1, runs: 22, balls: 14, fours: 2, sixes: 1, out: true }
];

(async () => {
  await mongoose.connect(MONGO_URL);
  await Promise.all([Team.deleteMany({}), Innings.deleteMany({})]);
  await Team.insertMany(teams);
  await Innings.insertMany(innings);

  // 1. Career stats per player: runs, innings, average (runs / times out), strike rate
  console.log("1. Batting table:");
  console.table(await Innings.aggregate([
    { $group: {
        _id: "$player", team: { $first: "$team" }, innings: { $sum: 1 }, runs: { $sum: "$runs" }, balls: { $sum: "$balls" },
        outs: { $sum: { $cond: ["$out", 1, 0] } }, highest: { $max: "$runs" } } },
    { $project: {
        _id: 0, player: "$_id", team: 1, innings: 1, runs: 1, highest: 1,
        average: { $cond: [{ $eq: ["$outs", 0] }, null, { $round: [{ $divide: ["$runs", "$outs"] }, 2] }] },
        strikeRate: { $round: [{ $multiply: [{ $divide: ["$runs", "$balls"] }, 100] }, 1] } } },
    { $sort: { runs: -1 } }
  ]));

  // 2. Label each innings with $switch and count the labels with $sortByCount
  console.log("2. Innings by milestone:", await Innings.aggregate([
    { $addFields: { milestone: { $switch: { branches: [
        { case: { $gte: ["$runs", 100] }, then: "Century" },
        { case: { $gte: ["$runs", 50] }, then: "Fifty" },
        { case: { $eq: ["$runs", 0] }, then: "Duck" }
      ], default: "Under 50" } } } },
    { $sortByCount: "$milestone" }
  ]));

  // 3. Boundaries per team, joined with the college name via $lookup
  console.log("3. Boundaries by college:", await Innings.aggregate([
    { $group: { _id: "$team", fours: { $sum: "$fours" }, sixes: { $sum: "$sixes" } } },
    { $lookup: { from: "teams", localField: "_id", foreignField: "code", as: "t" } },
    { $unwind: "$t" },
    { $project: { _id: 0, college: "$t.college", fours: 1, sixes: 1, boundaryRuns: { $add: [{ $multiply: ["$fours", 4] }, { $multiply: ["$sixes", 6] }] } } },
    { $sort: { boundaryRuns: -1 } }
  ]));

  // 4. Top 3 single-innings scores with strike rate over 120
  console.log("4. Fast big scores:", await Innings.aggregate([
    { $match: { $expr: { $gt: [{ $multiply: [{ $divide: ["$runs", "$balls"] }, 100] }, 120] } } },
    { $sort: { runs: -1 } },
    { $limit: 3 },
    { $project: { _id: 0, player: 1, match: 1, runs: 1, balls: 1 } }
  ]));

  // 5. Save a leaderboard into a new collection with $out
  await Innings.aggregate([
    { $group: { _id: "$player", runs: { $sum: "$runs" } } },
    { $sort: { runs: -1 } },
    { $out: "leaderboard" }
  ]);
  const board = await mongoose.connection.db.collection("leaderboard").find().toArray();
  console.log("5. Leaderboard collection written with $out:", board.map(b => `${b._id}: ${b.runs}`).join(", "));

  await mongoose.disconnect();
})().catch(err => { console.error("Could not run:", err.message); process.exit(1); });
