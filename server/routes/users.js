const express = require('express');
const router = express.Router();
const pool = require('../db');
const logAuditTrail = require('../utils/logAuditTrail');

// GET /api/users/fetchall
router.get('/usersfetch', async (req, res) => {
  const user = req.user || {};

  try {
    const result = await pool.query(`
      SELECT id, name, email, is_active, created_at
      FROM users
      ORDER BY id DESC
    `);

    await logAuditTrail({
      req,
      user_id: user.id,
      action_type: 'Read',
      module_name: 'Users',
      target: 'All Users',
      result_summary: `${result.rows.length} users fetched`,
    });

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);

    await logAuditTrail({
      req,
      user_id: user.id,
      action_type: 'Read',
      module_name: 'Users',
      target: 'All Users',
      result_summary: err.message,
      status: 'error'
    });

    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
