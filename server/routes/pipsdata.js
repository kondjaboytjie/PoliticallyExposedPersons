const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL pool

router.get('/pipsfetch', async (req, res) => {
  try {
    const query = (req.query.query || '').toLowerCase();

    const fetchPipsWithDetails = async (ids) => {
      if (ids.length === 0) return [];

      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');

      // Fetch main PIP info with foreign details
      const pipsResult = await pool.query(`
        SELECT p.*, 
          fp.country AS foreign_country, 
          fp.additional_notes,
          -- Concatenate full name for frontend convenience
          CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name) AS full_name
        FROM pips p
        LEFT JOIN foreign_pips fp ON p.id = fp.pip_id
        WHERE p.id IN (${placeholders})
        ORDER BY p.id
      `, ids);

      const pipIds = pipsResult.rows.map(row => row.id);

      // Fetch associates
      const associatesResult = await pool.query(
        `SELECT * FROM pip_associates WHERE pip_id IN (${placeholders}) ORDER BY pip_id`,
        ids
      );

      // Group associates by pip_id
      const associatesByPip = {};
      associatesResult.rows.forEach(a => {
        if (!associatesByPip[a.pip_id]) associatesByPip[a.pip_id] = [];
        associatesByPip[a.pip_id].push(a);
      });

      // Fetch institutions
      const institutionsResult = await pool.query(
        `SELECT * FROM pip_institutions WHERE pip_id IN (${placeholders}) ORDER BY pip_id`,
        ids
      );

      // Group institutions by pip_id
      const institutionsByPip = {};
      institutionsResult.rows.forEach(inst => {
        if (!institutionsByPip[inst.pip_id]) institutionsByPip[inst.pip_id] = [];
        institutionsByPip[inst.pip_id].push(inst);
      });

      // Return combined data
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

    if (!query) {
      const allPipsResult = await pool.query('SELECT id FROM pips ORDER BY id');
      const allIds = allPipsResult.rows.map(r => r.id);
      const pipsWithDetails = await fetchPipsWithDetails(allIds);
      return res.json(pipsWithDetails);
    }

    const term = `%${query}%`;

    // Search PIPs by concatenated name or national_id
    const directPIPs = await pool.query(`
      SELECT id FROM pips
      WHERE LOWER(CONCAT_WS(' ', first_name, middle_name, last_name)) LIKE $1
        OR national_id ILIKE $1
    `, [term]);

    // Search associates by concatenated name or national_id
    const assocPipIdsResult = await pool.query(`
      SELECT DISTINCT pip_id FROM pip_associates
      WHERE LOWER(CONCAT_WS(' ', first_name, middle_name, last_name)) LIKE $1
        OR national_id ILIKE $1
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
      first_name,
      middle_name,
      last_name,
      national_id,
      pip_type,
      reason,
      is_foreign,
      associates,
      institutions,
      foreign
    } = req.body;

    await client.query('BEGIN');

    // Insert into pips with separate name fields
    const pipInsert = await client.query(
      `INSERT INTO pips (first_name, middle_name, last_name, national_id, pip_type, reason, is_foreign)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [first_name, middle_name, last_name, national_id, pip_type, reason, is_foreign]
    );

    const pipId = pipInsert.rows[0].id;

    // Insert associates with separate name fields
    if (Array.isArray(associates) && associates.length > 0) {
      for (const assoc of associates) {
        const { first_name, middle_name, last_name, relationship_type, national_id } = assoc;
        await client.query(
          `INSERT INTO pip_associates (pip_id, first_name, middle_name, last_name, relationship_type, national_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [pipId, first_name, middle_name || null, last_name, relationship_type || null, national_id || null]
        );
      }
    }

    // Insert institutions
    if (Array.isArray(institutions) && institutions.length > 0) {
      for (const inst of institutions) {
        const { institution_name, institution_type, position, start_date, end_date } = inst;
        if (institution_name && institution_name.trim() !== '') {
          await client.query(
            `INSERT INTO pip_institutions (pip_id, institution_name, institution_type, position, start_date, end_date)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [pipId, institution_name, institution_type || null, position || null, start_date || null, end_date || null]
          );
        }
      }
    }

    // Insert foreign details
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
