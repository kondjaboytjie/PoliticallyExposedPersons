const express = require('express');
const router = express.Router();
const pool = require('../db');
const logAuditTrail = require('../utils/logAuditTrail'); // Audit trail logger

// Fetch Audit Trail Logs
router.get('/audittrailsfetch', async (req, res) => {
  const user = req.user || {};
  const query = (req.query.query || '').toLowerCase();

  try {
    const logsResult = await pool.query(`
      SELECT
        a.id,
        a.user_id,
        u.email AS user_email,
        a.action_type,
        a.module_name,
        a.target,
        a.result_summary,
        a.status,
        a.ip_address,
        a.user_agent,
        a.session_id,
        a.metadata,
        a.timestamp
      FROM audit_trail a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
    `);

    const logs = logsResult.rows;

    await logAuditTrail({
      req,
      user_id: user?.id || null,
      action_type: 'Fetch',
      module_name: 'Audit Trail',
      target: query || 'All Logs',
      result_summary: `${logs.length} audit logs fetched`,
      metadata: { query }
    });

    res.json(logs);
  } catch (err) {
    console.error('Audit fetch error:', err);
    await logAuditTrail({
      req,
      user_id: user?.id || null,
      action_type: 'Fetch',
      module_name: 'Audit Trail',
      target: query || 'All Logs',
      result_summary: err.message,
      status: 'error',
      metadata: { query }
    });
    res.status(500).json({ error: 'Server error fetching audit logs' });
  }
});

module.exports = router;
