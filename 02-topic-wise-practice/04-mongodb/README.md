## MongoDB

**mongoose-schema-validation.js**: a clinic with doctors and appointments. Covers enum messages, getters and setters, query middleware that hides inactive doctors, multiple validators on one field (future date, not a Sunday), a regex for allowed time slots, an async validator on a reference, and a compound unique index that stops double-booking.

**aggregation-queries.js**: inter-college cricket stats. Builds a batting table (average, strike rate), labels innings with `$switch` and counts them with `$sortByCount`, joins team names with `$lookup`, filters with `$expr`, and writes a leaderboard collection with `$out`.

Start MongoDB, then `npm install`, `npm run validation` and `npm run aggregation`.
