const express = require('express');
const router = express.Router();
const pool = require('../db');
const logAuditTrail = require('../utils/logAuditTrail');

// GET users with roles
router.get('/usersfetch', async (req, res) => {
  const user = req.user || {}; // may be empty if unauthenticated

  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.is_active,
        u.created_at,
        ARRAY_REMOVE(ARRAY_AGG(r.name), NULL) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
      LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
      GROUP BY u.id
      ORDER BY u.id DESC
    `);

    // Only log if user.id is present (avoid audit trail FK errors)
    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Read',
        module_name: 'Users',
        target: 'All Users',
        result_summary: `${result.rows.length} users fetched`,
      });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);

    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Read',
        module_name: 'Users',
        target: 'All Users',
        result_summary: err.message,
        status: 'error',
      });
    }

    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST add user
router.post('/useradd', async (req, res) => {
  const { first_name, last_name, email, password, roles } = req.body;
  const user = req.user || {}; // Authenticated user performing the action (optional)
  const roleNames = Array.isArray(roles) ? roles : [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertUser = await client.query(
      `INSERT INTO users (first_name, last_name, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, first_name, last_name, email, is_active, created_at`,
      [first_name, last_name, email, password]
    );

    const userId = insertUser.rows[0].id;

    for (const roleName of roleNames) {
      const roleResult = await client.query(
        `SELECT id FROM roles WHERE name = $1 AND is_active = TRUE`,
        [roleName]
      );
      if (roleResult.rows.length > 0) {
        const roleId = roleResult.rows[0].id;
        await client.query(
          `INSERT INTO user_roles (user_id, role_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [userId, roleId]
        );
      }
    }

    await client.query('COMMIT');

    // ✅ Log successful creation
    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Create',
        module_name: 'Users',
        target: `${first_name} ${last_name}`,
        result_summary: `User created with roles: ${roleNames.join(', ')}`,
        status: 'success'
      });
    }

    res.json({ message: 'User added successfully', user: insertUser.rows[0] });

  } catch (err) {
    await client.query('ROLLBACK');

    // ✅ Duplicate email check
    if (err.code === '23505' && err.constraint === 'users_email_key') {
      if (user.id) {
        await logAuditTrail({
          req,
          user_id: user.id,
          action_type: 'Create',
          module_name: 'Users',
          target: email,
          result_summary: 'Attempted to create user with duplicate email',
          status: 'error'
        });
      }
      return res.status(400).json({ error: 'Email already exists' });
    }

    // ✅ Log generic failure
    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Create',
        module_name: 'Users',
        target: email,
        result_summary: err.message,
        status: 'error'
      });
    }

    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    client.release();
  }
});

router.patch('/toggle-status/:id', async (req, res) => {
  const { id } = req.params;
  const user = req.user || {}; // The authenticated user performing the action

  try {
    const toggle = await pool.query(
      `UPDATE users
       SET is_active = NOT is_active
       WHERE id = $1
       RETURNING id, first_name, last_name, is_active`,
      [id]
    );

    if (toggle.rows.length === 0) {
      if (user.id) {
        await logAuditTrail({
          req,
          user_id: user.id,
          action_type: 'Update',
          module_name: 'Users',
          target: `User ID ${id}`,
          result_summary: 'User not found for toggle',
          status: 'error'
        });
      }
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = toggle.rows[0];
    const newStatus = updatedUser.is_active ? 'active' : 'inactive';

    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Update',
        module_name: 'Users',
        target: `${updatedUser.first_name} ${updatedUser.last_name}`,
        result_summary: `User status changed to ${newStatus}`,
        status: 'success'
      });
    }

    res.json({ message: `User is now ${newStatus}` });
  } catch (err) {
    console.error('Error toggling user status:', err);

    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Update',
        module_name: 'Users',
        target: `User ID ${id}`,
        result_summary: err.message,
        status: 'error'
      });
    }

    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// disable user
// SOFT DELETE user (sets is_active = false)
router.delete('/userdelete:id', async (req, res) => {
  const userId = req.params.id;
  const user = req.user || {};

  try {
    const result = await pool.query(
      'UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING id, email',
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Audit log
    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Delete',
        module_name: 'Users',
        target: result.rows[0].email,
        result_summary: 'User marked as inactive',
        status: 'success'
      });
    }

    res.json({ message: 'User marked as inactive' });
  } catch (err) {
    console.error('Error disabling user:', err);

    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Delete',
        module_name: 'Users',
        target: `User ID ${userId}`,
        result_summary: err.message,
        status: 'error'
      });
    }

    res.status(500).json({ error: 'Failed to disable user' });
  }
});



//fetchroles
router.get('/rolesfetch', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, name FROM roles WHERE is_active = true ORDER BY name`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});


module.exports = router;
