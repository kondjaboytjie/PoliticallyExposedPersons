import React, { useState } from 'react';
import './Pages.css';

function DataCapturer() {
  const [pipType, setPipType] = useState(null);
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [reason, setReason] = useState('');
  const [associates, setAssociates] = useState([{ associate_name: '', relationship_type: '', national_id: '' }]);
  const [foreignDetails, setForeignDetails] = useState({ country: '', additional_notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const addAssociate = () => {
    setAssociates([...associates, { associate_name: '', relationship_type: '', national_id: '' }]);
  };

  const handleAssociateChange = (index, field, value) => {
    const updated = [...associates];
    updated[index][field] = value;
    setAssociates(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    // Filter out associates that have no associate_name (optional: also check other fields)
    const filteredAssociates = associates.filter(
      (a) => a.associate_name.trim() !== '' ||
             a.relationship_type.trim() !== '' ||
             a.national_id.trim() !== ''
    );

    const pipData = {
      full_name: fullName,
      national_id: nationalId,
      pip_type: pipType,
      reason,
      is_foreign: pipType === 'Foreign',
      associates: filteredAssociates,
      foreign: pipType === 'Foreign' ? foreignDetails : null
    };

    try {
      const res = await fetch('http://localhost:5000/api/pipsdata/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pipData)
      });

      if (!res.ok) throw new Error('Failed to save data');

      setMessage('✅ PIP successfully captured!');
      setFullName('');
      setNationalId('');
      setReason('');
      setAssociates([{ associate_name: '', relationship_type: '', national_id: '' }]);
      setForeignDetails({ country: '', additional_notes: '' });
      setPipType(null);
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="button-group">
        <button
          className={`export-button ${pipType === 'Local' ? 'active-button' : ''}`}
          onClick={() => setPipType('Local')}
        >
          + Capture Local PIP
        </button>
        <button
          className={`export-button ${pipType === 'Foreign' ? 'active-button' : ''}`}
          onClick={() => setPipType('Foreign')}
        >
          + Capture Foreign PIP
        </button>
      </div>

      {pipType && (
        <form className="table-container" onSubmit={handleSubmit}>
          <h3>{pipType} PIP Information</h3>

          <div className="form-group">
            <input placeholder="Full Name" value={fullName} required onChange={(e) => setFullName(e.target.value)} />
            <input placeholder="National ID" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
            <input placeholder="Reason" value={reason} required onChange={(e) => setReason(e.target.value)} />
          </div>

          {pipType === 'Foreign' && (
            <div className="form-group">
              <input
                placeholder="Country"
                value={foreignDetails.country}
                required
                onChange={(e) => setForeignDetails({ ...foreignDetails, country: e.target.value })}
              />
              <textarea
                placeholder="Additional Notes"
                value={foreignDetails.additional_notes}
                onChange={(e) => setForeignDetails({ ...foreignDetails, additional_notes: e.target.value })}
              />
            </div>
          )}

          <h4 style={{ marginTop: '1rem' }}>Associates</h4>
          {associates.map((assoc, idx) => (
            <div key={idx} className="form-group">
              <input
                placeholder="Associate Name"
                value={assoc.associate_name}
                // Removed required attribute here
                onChange={(e) => handleAssociateChange(idx, 'associate_name', e.target.value)}
              />
              <input
                placeholder="Relationship Type"
                value={assoc.relationship_type}
                onChange={(e) => handleAssociateChange(idx, 'relationship_type', e.target.value)}
              />
              <input
                placeholder="Associate National ID"
                value={assoc.national_id}
                onChange={(e) => handleAssociateChange(idx, 'national_id', e.target.value)}
              />
            </div>
          ))}

          <button type="button" className="export-button" onClick={addAssociate}>
            + Add Another Associate
          </button>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="export-button" disabled={submitting}>
              {submitting ? 'Saving...' : 'Submit PIP'}
            </button>
            <button
              type="button"
              onClick={() => setPipType(null)}
              className="export-button"
              style={{ background: '#ccc', marginLeft: '1rem' }}
            >
              Cancel
            </button>
          </div>

          {message && <p style={{ marginTop: '1rem', color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
        </form>
      )}
    </div>
  );
}

export default DataCapturer;
