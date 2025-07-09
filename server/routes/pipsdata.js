const express = require('express');
const router = express.Router();
const pool = require('../db'); // assuming you have a db.js with PG pool setup

// Get all PIPs with their associates
router.get('/pipsfetch', async (req, res) => {
  try {
    // Fetch all PIPs
    const pipsResult = await pool.query('SELECT * FROM pips ORDER BY id');

    // Fetch all associates
    const associatesResult = await pool.query('SELECT * FROM pip_associates ORDER BY pip_id');

    // Map associates by pip_id
    const associatesByPip = {};
    associatesResult.rows.forEach(a => {
      if (!associatesByPip[a.pip_id]) associatesByPip[a.pip_id] = [];
      associatesByPip[a.pip_id].push(a);
    });

    // Attach associates array to each pip
    const pipsWithAssociates = pipsResult.rows.map(pip => ({
      ...pip,
      associates: associatesByPip[pip.id] || []
    }));

    res.json(pipsWithAssociates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching PIPs' });
  }
});

module.exports = router;
