const express = require('express');
const router = express.Router();
const pool = require('../db');
const logAuditTrail = require('../utils/logAuditTrail'); // Audit trail logger

// Fetch PIPs
// Fetch PIPs
router.get('/pipsfetch', async (req, res) => {
  const user = req.user || {};
  const query = (req.query.query || '').toLowerCase();

  const fetchPipsWithDetails = async (ids) => {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');

    const pipsResult = await pool.query(`
      SELECT p.*, 
        fp.country AS foreign_country, 
        fp.additional_notes,
        CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name) AS full_name
      FROM pips p
      LEFT JOIN foreign_pips fp ON p.id = fp.pip_id
      WHERE p.id IN (${placeholders})
      ORDER BY p.id
    `, ids);

    const pipIds = pipsResult.rows.map(r => r.id);

    const [associatesResult, institutionsResult] = await Promise.all([
      pool.query(`SELECT * FROM pip_associates WHERE pip_id IN (${placeholders})`, ids),
      pool.query(`SELECT * FROM pip_institutions WHERE pip_id IN (${placeholders})`, ids)
    ]);

    const associatesByPip = {};
    associatesResult.rows.forEach(a => {
      if (!associatesByPip[a.pip_id]) associatesByPip[a.pip_id] = [];
      associatesByPip[a.pip_id].push(a);
    });

    const institutionsByPip = {};
    institutionsResult.rows.forEach(inst => {
      if (!institutionsByPip[inst.pip_id]) institutionsByPip[inst.pip_id] = [];
      institutionsByPip[inst.pip_id].push(inst);
    });

    return pipsResult.rows.map(pip => ({
      ...pip,
      associates: associatesByPip[pip.id] || [],
      institutions: institutionsByPip[pip.id] || [],
      country: pip.is_foreign ? (pip.foreign_country || 'Unknown') : 'Namibia',
      foreign: pip.is_foreign ? {
        country: pip.foreign_country,
        additional_notes: pip.additional_notes
      } : null
    }));
  };

  try {
    if (!query) {
      const allPips = await pool.query('SELECT id FROM pips ORDER BY id');
      const allIds = allPips.rows.map(r => r.id);
      const data = await fetchPipsWithDetails(allIds);

     await logAuditTrail({
  req,
  user_id: user.id,
  action_type: 'Search',
  module_name: 'PIPs',
  target: `Query="${query}"`,
  result_summary: `${allIds.length} matches`, // <= Count actual matched PIPs before expanding details
  metadata: { query }
});


      return res.json(data);
    }

    const term = `%${query}%`;

    // Only search directly in PIPs table
    const direct = await pool.query(`
      SELECT id FROM pips
      WHERE LOWER(CONCAT_WS(' ', first_name, middle_name, last_name)) LIKE $1
      OR national_id ILIKE $1
    `, [term]);

    const directIds = direct.rows.map(r => r.id);
    const data = await fetchPipsWithDetails(directIds);

    await logAuditTrail({
      req,
      user_id: user.id,
      action_type: 'Search',
      module_name: 'PIPs',
      target: `Query="${query}"`,
      result_summary: `${data.length} direct matches`,
      metadata: { query }
    });

    res.json(data);
  } catch (err) {
    console.error('Fetch error:', err);
    await logAuditTrail({
      req,
      user_id: user.id,
      action_type: 'Search',
      module_name: 'PIPs',
      target: query,
      result_summary: err.message,
      status: 'error',
      metadata: { query }
    });
    res.status(500).json({ error: 'Server error fetching PIPs' });
  }
});


// Create PIP
router.post('/create', async (req, res) => {
  const client = await pool.connect();
  const user = req.user || {};

  try {
    const {
      first_name, middle_name, last_name, national_id, pip_type,
      reason, is_foreign, associates, institutions, foreign
    } = req.body;

    await client.query('BEGIN');

    const pipRes = await client.query(
      `INSERT INTO pips (first_name, middle_name, last_name, national_id, pip_type, reason, is_foreign)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [first_name, middle_name, last_name, national_id, pip_type, reason, is_foreign]
    );

    const pipId = pipRes.rows[0].id;

    if (Array.isArray(associates)) {
      for (const a of associates) {
        await client.query(
          `INSERT INTO pip_associates (pip_id, first_name, middle_name, last_name, relationship_type, national_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [pipId, a.first_name, a.middle_name || null, a.last_name, a.relationship_type || null, a.national_id || null]
        );
      }
    }

    if (Array.isArray(institutions)) {
      for (const inst of institutions) {
        await client.query(
          `INSERT INTO pip_institutions (pip_id, institution_name, institution_type, position, start_date, end_date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [pipId, inst.institution_name, inst.institution_type || null, inst.position || null, inst.start_date || null, inst.end_date || null]
        );
      }
    }

    if (is_foreign && foreign?.country) {
      await client.query(
        `INSERT INTO foreign_pips (pip_id, country, additional_notes)
         VALUES ($1, $2, $3)`,
        [pipId, foreign.country, foreign.additional_notes || null]
      );
    }

    await client.query('COMMIT');

    await logAuditTrail({
      req,
      user_id: user.id,
      action_type: 'Create',
      module_name: 'PIPs',
      target: `${first_name} ${last_name}`,
      result_summary: 'PIP created successfully',
      metadata: req.body
    });

    res.status(201).json({ message: 'PIP created successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create error:', err);
    await logAuditTrail({
      req,
      user_id: user.id,
      action_type: 'Create',
      module_name: 'PIPs',
      target: `${req.body?.first_name || ''} ${req.body?.last_name || ''}`,
      result_summary: err.message,
      status: 'error',
      metadata: req.body
    });
    res.status(500).json({ error: 'Server error while creating PIP' });
  } finally {
    client.release();
  }
});

module.exports = router;
