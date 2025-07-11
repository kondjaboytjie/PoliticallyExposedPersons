const pool = require('../db'); // your PostgreSQL pool instance (e.g. from pg)

async function logAuditTrail({
  req,
  user_id = null,
  user_email = null,
  action_type,
  module_name = null,
  target = null,
  result_summary = null,
  status = 'success',
  session_id = null,
  metadata = null
}) {
  try {
    // Get client IP address - prefer first IP in x-forwarded-for if behind proxy
    const ipHeader = req.headers['x-forwarded-for'];
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : req.socket.remoteAddress;

    const userAgent = req.headers['user-agent'];

    // Auto-fetch user_id by email if not provided
    if (!user_id && user_email) {
      const result = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [user_email]
      );
      if (result.rows.length > 0) {
        user_id = result.rows[0].id;
      }
    }

    const query = `
      INSERT INTO audit_trail (
        user_id,
        action_type,
        module_name,
        target,
        result_summary,
        status,
        ip_address,
        user_agent,
        session_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    const values = [
      user_id,
      action_type,
      module_name,
      target,
      result_summary,
      status,
      ip,
      userAgent,
      session_id,
      metadata ? JSON.stringify(metadata) : null
    ];

    await pool.query(query, values);
  } catch (err) {
    console.error('Audit log error:', err);
    // Do not crash the app if audit logging fails
  }
}

module.exports = logAuditTrail;
