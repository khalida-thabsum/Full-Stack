require('dotenv').config();
const app = require('./app');
const { connect } = require('./config/database');

const port = process.env.PORT || 8080;

connect().then(() => {
  app.listen(port, () => console.log(`Hostel Complaint API listening on port ${port}`));
});
