const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());


const authenticateToken = require('./middleware/authMiddleware');
app.use(authenticateToken);

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const pipsRoutes = require('./routes/pipsdata');
app.use('/api/pipsdata', pipsRoutes);

const auditTrailRoutes = require('./routes/audittrails');
app.use('/api/audittrails', auditTrailRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
