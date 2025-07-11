import React, { useState } from 'react';
import './Pages.css';

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Brazzaville)',
  'Congo (Kinshasa)', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark',
  'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
  'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati',
  'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco',
  'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia',
  'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain',
  'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe'
];

function DataCapturer() {
  const [pipType, setPipType] = useState(null);

  // Separate name fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');

  const [nationalId, setNationalId] = useState('');
  const [reason, setReason] = useState('');

  const [associates, setAssociates] = useState([{ first_name: '', middle_name: '', last_name: '', relationship_type: '', national_id: '' }]);
  const [institutions, setInstitutions] = useState([{ institution_name: '', institution_type: '', position: '', start_date: '', end_date: '' }]);

  const [foreignDetails, setForeignDetails] = useState({ country: '', additional_notes: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessagePopup, setShowMessagePopup] = useState(false);

  // Add associate row
  const addAssociate = () => {
    setAssociates([...associates, { first_name: '', middle_name: '', last_name: '', relationship_type: '', national_id: '' }]);
  };

  // Add institution row
  const addInstitution = () => {
    setInstitutions([...institutions, { institution_name: '', institution_type: '', position: '', start_date: '', end_date: '' }]);
  };

  // Handle associate field change
  const handleAssociateChange = (index, field, value) => {
    const updated = [...associates];
    updated[index][field] = value;
    setAssociates(updated);
  };

  // Handle institution field change
  const handleInstitutionChange = (index, field, value) => {
    const updated = [...institutions];
    updated[index][field] = value;
    setInstitutions(updated);
  };

  // Handle national ID input restriction for local PIP
  const handleNationalIdChange = (e) => {
    if (pipType === 'Local') {
      const digits = e.target.value.replace(/\D/g, '');
      setNationalId(digits.slice(0, 11));
    } else {
      setNationalId(e.target.value);
    }
  };

  // Country autocomplete handling unchanged
  const handleCountryChange = (e) => {
    const val = e.target.value;
    setForeignDetails({ ...foreignDetails, country: val });
    if (val.trim() === '') {
      setSuggestions([]);
    } else {
      const filtered = countries.filter((c) =>
        c.toLowerCase().startsWith(val.toLowerCase())
      );
      setSuggestions(filtered);
    }
  };

  const selectCountry = (country) => {
    setForeignDetails({ ...foreignDetails, country });
    setSuggestions([]);
  };

  // Reset form
  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setNationalId('');
    setReason('');
    setAssociates([{ first_name: '', middle_name: '', last_name: '', relationship_type: '', national_id: '' }]);
    setInstitutions([{ institution_name: '', institution_type: '', position: '', start_date: '', end_date: '' }]);
    setForeignDetails({ country: '', additional_notes: '' });
    setPipType(null);
  };

  const closeMessagePopup = () => {
    setShowMessagePopup(false);
    setMessage('');
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setShowMessagePopup(false);

    if (pipType === 'Local' && nationalId.length !== 11) {
      setMessage('❌ National ID must be exactly 11 digits for local PIP');
      setShowMessagePopup(true);
      return;
    }

    if (pipType === 'Foreign' && !countries.includes(foreignDetails.country)) {
      setMessage('❌ Please select a valid country from the list');
      setShowMessagePopup(true);
      return;
    }

    setSubmitting(true);

    // Filter associates: only include if at least one field is non-empty
    const filteredAssociates = associates.filter(a =>
      a.first_name.trim() !== '' || a.middle_name.trim() !== '' || a.last_name.trim() !== '' ||
      a.relationship_type.trim() !== '' || a.national_id.trim() !== ''
    );

    // Filter institutions: only include if institution_name is non-empty
    const filteredInstitutions = institutions.filter(i => i.institution_name.trim() !== '');

    const pipData = {
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      national_id: nationalId,
      pip_type: pipType,
      reason,
      is_foreign: pipType === 'Foreign',
      associates: filteredAssociates,
      institutions: filteredInstitutions,
      foreign: pipType === 'Foreign' ? foreignDetails : null
    };

    try {
      const res = await fetch('http://localhost:5000/api/pipsdata/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('token')}`},
        body: JSON.stringify(pipData)
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Failed to save data');

      setMessage('✅ PIP successfully captured!');
      setShowMessagePopup(true);
      setTimeout(() => {
        resetForm();
        closeMessagePopup();
      }, 2000);

    } catch (err) {
      setMessage('❌ Error: ' + err.message);
      setShowMessagePopup(true);
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
        <form className="table-container" onSubmit={handleSubmit} style={{ position: 'relative' }}>
          <h3>{pipType} PIP Information</h3>

          <div className="form-group name-group">
            <input
              placeholder="First Name"
              value={firstName}
              required
              onChange={e => setFirstName(e.target.value)}
            />
            <input
              placeholder="Middle Name"
              value={middleName}
              onChange={e => setMiddleName(e.target.value)}
            />
            <input
              placeholder="Last Name"
              value={lastName}
              required
              onChange={e => setLastName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <input
              placeholder="National ID"
              value={nationalId}
              onChange={handleNationalIdChange}
              inputMode={pipType === 'Local' ? 'numeric' : 'text'}
              pattern={pipType === 'Local' ? '\\d{11}' : undefined}
              title={pipType === 'Local' ? 'Exactly 11 digits' : undefined}
              required
            />
            <input
              placeholder="Reason"
              value={reason}
              required
              onChange={e => setReason(e.target.value)}
            />
          </div>

          {pipType === 'Foreign' && (
            <div className="form-group" style={{ position: 'relative' }}>
              <input
                placeholder="Country"
                value={foreignDetails.country}
                required
                onChange={handleCountryChange}
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map((c, i) => (
                    <li key={i} onClick={() => selectCountry(c)}>{c}</li>
                  ))}
                </ul>
              )}
              <textarea
                placeholder="Additional Notes"
                value={foreignDetails.additional_notes}
                onChange={e =>
                  setForeignDetails({ ...foreignDetails, additional_notes: e.target.value })
                }
              />
            </div>
          )}

           <h4 style={{ marginTop: '1rem' }}>PIP Institution Details</h4>
          {institutions.map((inst, idx) => (
            <div key={idx} className="form-group institution-group">
              <input
                placeholder="Institution Name"
                value={inst.institution_name}
                required={idx === 0} // require first row institution name
                onChange={e => handleInstitutionChange(idx, 'institution_name', e.target.value)}
              />
              <input
                placeholder="Institution Type"
                value={inst.institution_type}
                onChange={e => handleInstitutionChange(idx, 'institution_type', e.target.value)}
              />
              <input
                placeholder="Position"
                value={inst.position}
                onChange={e => handleInstitutionChange(idx, 'position', e.target.value)}
              />
              <input
                type="date"
                placeholder="Start Date"
                value={inst.start_date}
                onChange={e => handleInstitutionChange(idx, 'start_date', e.target.value)}
              />
              <input
                type="date"
                placeholder="End Date"
                value={inst.end_date}
                onChange={e => handleInstitutionChange(idx, 'end_date', e.target.value)}
              />
            </div>
          ))}
          <button type="button" className="export-button" onClick={addInstitution}>
            + Add Another Institution
          </button>

          <h4 style={{ marginTop: '1rem' }}>Associates</h4>
          {associates.map((assoc, idx) => (
            <div key={idx} className="form-group name-group">
              <input
                placeholder="First Name"
                value={assoc.first_name}
                onChange={e => handleAssociateChange(idx, 'first_name', e.target.value)}
              />
              <input
                placeholder="Middle Name"
                value={assoc.middle_name}
                onChange={e => handleAssociateChange(idx, 'middle_name', e.target.value)}
              />
              <input
                placeholder="Last Name"
                value={assoc.last_name}
                onChange={e => handleAssociateChange(idx, 'last_name', e.target.value)}
              />
              <input
                placeholder="Relationship Type"
                value={assoc.relationship_type}
                onChange={e => handleAssociateChange(idx, 'relationship_type', e.target.value)}
              />
              <input
                placeholder="Associate National ID"
                value={assoc.national_id}
                onChange={e => handleAssociateChange(idx, 'national_id', e.target.value)}
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
              onClick={resetForm}
              className="export-button"
              style={{ background: '#ccc', marginLeft: '1rem' }}
            >
              Cancel
            </button>
          </div>

          {showMessagePopup && (
            <div className="message-popup">
              <div className="message-popup-content">
                <p>{message}</p>
                <button onClick={closeMessagePopup} className="close-popup-button">Close</button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default DataCapturer;
