const express = require('express');
const router = express.Router();
const pool = require('../db');
const logAuditTrail = require('../utils/logAuditTrail');

// GET users with roles
router.get('/usersfetch', async (req, res) => {
  const user = req.user || {};

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

// POST create user
router.post('/useradd', async (req, res) => {
  const { first_name, last_name, email, password, roles } = req.body;
  const user = req.user || {};
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
        await client.query(
          `INSERT INTO user_roles (user_id, role_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, roleResult.rows[0].id]
        );
      }
    }

    await client.query('COMMIT');

    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Create',
        module_name: 'Users',
        target: `${first_name} ${last_name}`,
        result_summary: `User created with roles: ${roleNames.join(', ')}`,
        status: 'success',
      });
    }

    res.json({ message: 'User added successfully', user: insertUser.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23505' && err.constraint === 'users_email_key') {
      if (user.id) {
        await logAuditTrail({
          req,
          user_id: user.id,
          action_type: 'Create',
          module_name: 'Users',
          target: email,
          result_summary: 'Duplicate email error',
          status: 'error',
        });
      }
      return res.status(400).json({ error: 'Email already exists' });
    }

    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Create',
        module_name: 'Users',
        target: email,
        result_summary: err.message,
        status: 'error',
      });
    }

    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    client.release();
  }
});

// PUT update user and roles
router.put('/userupdate/:id', async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, password, roles } = req.body;
  const user = req.user || {};
  const roleNames = Array.isArray(roles) ? roles : [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, email = $3, password = $4
       WHERE id = $5`,
      [first_name, last_name, email, password, id]
    );

    await client.query(
      `UPDATE user_roles SET is_active = FALSE WHERE user_id = $1`,
      [id]
    );

    for (const roleName of roleNames) {
      const roleResult = await client.query(
        `SELECT id FROM roles WHERE name = $1 AND is_active = TRUE`,
        [roleName]
      );
      if (roleResult.rows.length > 0) {
        const roleId = roleResult.rows[0].id;
        await client.query(
          `INSERT INTO user_roles (user_id, role_id, is_active)
           VALUES ($1, $2, TRUE)
           ON CONFLICT (user_id, role_id) DO UPDATE SET is_active = TRUE`,
          [id, roleId]
        );
      }
    }

    await client.query('COMMIT');

    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Update',
        module_name: 'Users',
        target: `${first_name} ${last_name}`,
        result_summary: `User updated with roles: ${roleNames.join(', ')}`,
        status: 'success',
      });
    }

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');

    console.error('Error updating user:', err);
    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Update',
        module_name: 'Users',
        target: id,
        result_summary: err.message,
        status: 'error',
      });
    }

    res.status(500).json({ error: 'Failed to update user' });
  } finally {
    client.release();
  }
});

// PATCH toggle status
router.patch('/toggle-status/:id', async (req, res) => {
  const { id } = req.params;
  const user = req.user || {};

  try {
    const toggle = await pool.query(
      `UPDATE users
       SET is_active = NOT is_active
       WHERE id = $1
       RETURNING id, first_name, last_name, is_active`,
      [id]
    );

    if (toggle.rows.length === 0) {
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
        status: 'success',
      });
    }

    res.json({ message: `User is now ${newStatus}` });
  } catch (err) {
    console.error('Error toggling user status:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// DELETE (soft delete)
router.delete('/userdelete/:id', async (req, res) => {
  const { id } = req.params;
  const user = req.user || {};

  try {
    const result = await pool.query(
      'UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING email',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Delete',
        module_name: 'Users',
        target: result.rows[0].email,
        result_summary: 'User marked as inactive',
        status: 'success',
      });
    }

    res.json({ message: 'User marked as inactive' });
  } catch (err) {
    console.error('Error disabling user:', err);
    res.status(500).json({ error: 'Failed to disable user' });
  }
});

// GET roles
router.get('/rolesfetch', async (req, res) => {
  const user = req.user || {};

  try {
    const result = await pool.query(
      `SELECT id, name, description FROM roles WHERE is_active = TRUE ORDER BY name`
    );

    // Audit: log success if user is authenticated
    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Read',
        module_name: 'Roles',
        target: 'All Roles',
        result_summary: `${result.rows.length} roles fetched`,
        status: 'success',
      });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching roles:', err);

    // Audit: log error if user is authenticated
    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Read',
        module_name: 'Roles',
        target: 'All Roles',
        result_summary: err.message,
        status: 'error',
      });
    }

    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// POST /api/users/roleadd
router.post('/roleadd', async (req, res) => {
  const { name, description } = req.body;
  const user = req.user || {};

  try {
    await pool.query(
      'INSERT INTO roles (name, description) VALUES ($1,$2)',
      [name.trim(), description || null]
    );

    // Audit: success
    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Create',
        module_name: 'Roles',
        target: name.trim(),
        result_summary: 'New role created',
        status: 'success',
      });
    }

    res.json({ message: 'Role added' });
  } catch (e) {
    console.error(e);

    // Audit: duplicate or DB error
    if (user.id) {
      await logAuditTrail({
        req,
        user_id: user.id,
        action_type: 'Create',
        module_name: 'Roles',
        target: name.trim(),
        result_summary: e.code === '23505' ? 'Duplicate role' : e.message,
        status: 'error',
      });
    }

    if (e.code === '23505') {
      return res.status(400).json({ error: 'Role already exists' });
    }

    res.status(500).json({ error: 'DB error' });
  }
});


module.exports = router;
