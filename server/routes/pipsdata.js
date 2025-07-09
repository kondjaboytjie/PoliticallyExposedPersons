const express = require('express');
const router = express.Router();
const pool = require('../db'); // Your PostgreSQL pool

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

module.exports = router;
