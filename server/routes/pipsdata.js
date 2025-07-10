const express = require('express');
const router = express.Router();
const pool = require('../db'); //PostgreSQL pool

router.get('/pipsfetch', async (req, res) => {
  try {
    const query = (req.query.query || '').toLowerCase();

    if (!query) {
      // Return all PIPs with their associates if no search query
      const pipsResult = await pool.query('SELECT * FROM pips ORDER BY id');
      const associatesResult = await pool.query('SELECT * FROM pip_associates ORDER BY pip_id');

      const associatesByPip = {};
      associatesResult.rows.forEach(a => {
        if (!associatesByPip[a.pip_id]) associatesByPip[a.pip_id] = [];
        associatesByPip[a.pip_id].push(a);
      });

      const pipsWithAssociates = pipsResult.rows.map(pip => ({
        ...pip,
        associates: associatesByPip[pip.id] || []
      }));

      return res.json(pipsWithAssociates);
    }

    const term = `%${query}%`;

    // 1. Direct match in PIPs table
    const directPIPs = await pool.query(`
      SELECT * FROM pips
      WHERE LOWER(full_name) LIKE $1 OR national_id ILIKE $1
    `, [term]);

    // 2. Match in Associates table
    const assocPipIdsResult = await pool.query(`
      SELECT DISTINCT pip_id FROM pip_associates
      WHERE LOWER(associate_name) LIKE $1 OR national_id ILIKE $1
    `, [term]);

    const assocPipIds = assocPipIdsResult.rows.map(r => r.pip_id);
    const directIds = directPIPs.rows.map(p => p.id);

    // Merge and deduplicate IDs
    const allIds = [...new Set([...directIds, ...assocPipIds])];

    if (allIds.length === 0) return res.json([]);

    // 3. Fetch matching PIPs
    const placeholders = allIds.map((_, i) => `$${i + 1}`).join(',');
    const pipsResult = await pool.query(
      `SELECT * FROM pips WHERE id IN (${placeholders}) ORDER BY id`,
      allIds
    );

    // 4. Fetch associates for these PIPs
    const associatesResult = await pool.query(
      `SELECT * FROM pip_associates WHERE pip_id IN (${placeholders}) ORDER BY pip_id`,
      allIds
    );

    const associatesByPip = {};
    associatesResult.rows.forEach(a => {
      if (!associatesByPip[a.pip_id]) associatesByPip[a.pip_id] = [];
      associatesByPip[a.pip_id].push(a);
    });

    const final = pipsResult.rows.map(pip => ({
      ...pip,
      associates: associatesByPip[pip.id] || []
    }));

    res.json(final);

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

    // 1. Insert into `pips`
    const pipInsert = await client.query(
      `INSERT INTO pips (full_name, national_id, pip_type, reason, is_foreign)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [full_name, national_id, pip_type, reason, is_foreign]
    );

    const pipId = pipInsert.rows[0].id;

    // 2. Insert associates (if any)
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

    // 3. If foreign, insert into `foreign_pips`
    if (is_foreign && foreign && foreign.country) {
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
