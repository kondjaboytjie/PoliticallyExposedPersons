const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL pool

router.get('/pipsfetch', async (req, res) => {
  try {
    const query = (req.query.query || '').toLowerCase();

    const fetchPipsWithDetails = async (ids) => {
      if (ids.length === 0) return [];

      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');

      const pipsResult = await pool.query(`
        SELECT p.*, fp.country AS foreign_country, fp.additional_notes
        FROM pips p
        LEFT JOIN foreign_pips fp ON p.id = fp.pip_id
        WHERE p.id IN (${placeholders})
        ORDER BY p.id
      `, ids);

      const pipIds = pipsResult.rows.map(row => row.id);

      const associatesResult = await pool.query(
        `SELECT * FROM pip_associates WHERE pip_id IN (${placeholders}) ORDER BY pip_id`,
        ids
      );

      const associatesByPip = {};
      associatesResult.rows.forEach(a => {
        if (!associatesByPip[a.pip_id]) associatesByPip[a.pip_id] = [];
        associatesByPip[a.pip_id].push(a);
      });

      return pipsResult.rows.map(pip => ({
        ...pip,
        associates: associatesByPip[pip.id] || [],
        country: pip.is_foreign ? (pip.foreign_country || 'Unknown') : 'Namibia',
        foreign: pip.is_foreign ? {
          country: pip.foreign_country,
          additional_notes: pip.additional_notes
        } : null
      }));
    };

    if (!query) {
      const allPipsResult = await pool.query('SELECT id FROM pips ORDER BY id');
      const allIds = allPipsResult.rows.map(r => r.id);
      const pipsWithDetails = await fetchPipsWithDetails(allIds);
      return res.json(pipsWithDetails);
    }

    const term = `%${query}%`;

    const directPIPs = await pool.query(`
      SELECT id FROM pips
      WHERE LOWER(full_name) LIKE $1 OR national_id ILIKE $1
    `, [term]);

    const assocPipIdsResult = await pool.query(`
      SELECT DISTINCT pip_id FROM pip_associates
      WHERE LOWER(associate_name) LIKE $1 OR national_id ILIKE $1
    `, [term]);

    const assocPipIds = assocPipIdsResult.rows.map(r => r.pip_id);
    const directIds = directPIPs.rows.map(p => p.id);
    const allIds = [...new Set([...directIds, ...assocPipIds])];

    if (allIds.length === 0) return res.json([]);

    const pipsWithDetails = await fetchPipsWithDetails(allIds);
    res.json(pipsWithDetails);

  } catch (err) {
    console.error('Error fetching PIPs:', err);
    res.status(500).json({ error: 'Server error fetching PIPs' });
  }
});

router.post('/create', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      full_name,
      national_id,
      pip_type,
      reason,
      is_foreign,
      associates,
      foreign
    } = req.body;

    await client.query('BEGIN');

    const pipInsert = await client.query(
      `INSERT INTO pips (full_name, national_id, pip_type, reason, is_foreign)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [full_name, national_id, pip_type, reason, is_foreign]
    );

    const pipId = pipInsert.rows[0].id;

    if (Array.isArray(associates) && associates.length > 0) {
      for (const assoc of associates) {
        const { associate_name, relationship_type, national_id } = assoc;
        await client.query(
          `INSERT INTO pip_associates (pip_id, associate_name, relationship_type, national_id)
           VALUES ($1, $2, $3, $4)`,
          [pipId, associate_name, relationship_type, national_id]
        );
      }
    }

    if (is_foreign && foreign?.country) {
      const { country, additional_notes } = foreign;
      await client.query(
        `INSERT INTO foreign_pips (pip_id, country, additional_notes)
         VALUES ($1, $2, $3)`,
        [pipId, country, additional_notes || null]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'PIP created successfully' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating PIP:', err);
    res.status(500).json({ error: 'Server error while creating PIP' });
  } finally {
    client.release();
  }
});

module.exports = router;
