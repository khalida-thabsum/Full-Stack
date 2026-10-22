const express = require('express');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api', routes);

app.use((req, res) => res.status(404).json({ error: { message: 'Endpoint not found' } }));
app.use(errorHandler);

module.exports = app;
