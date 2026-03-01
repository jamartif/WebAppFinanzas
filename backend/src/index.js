require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bankRoutes = require('./routes/banks');
const categoryRoutes = require('./routes/categories');
const snapshotRoutes = require('./routes/snapshots');
const incomeRoutes = require('./routes/income');
const dashboardRoutes = require('./routes/dashboard');
const profileRoutes = require('./routes/profiles');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/profiles', profileRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/snapshots', snapshotRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});
