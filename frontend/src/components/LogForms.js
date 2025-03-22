import React, { useState } from 'react';
import axios from 'axios';

const LogForm = ({ tripId, onLogCreated }) => {
  const [logData, setLogData] = useState({
    date: '',
    total_miles: 0,
    driving_time: 0,
    on_duty_time: 0,
    off_duty_time: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/trips/${tripId}/logs/`, logData);
      onLogCreated(response.data);
      setLogData({
        date: '',
        total_miles: 0,
        driving_time: 0,
        on_duty_time: 0,
        off_duty_time: 0
      });
    } catch (error) {
      console.error('Error creating log:', error);
    }
  };

  return (
    <div className="form-container">
      <h3>Add Log Entry</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="date"
          value={logData.date}
          onChange={e => setLogData({...logData, date: e.target.value})}
          required
        />
        <input
          type="number"
          placeholder="Total Miles"
          value={logData.total_miles}
          onChange={e => setLogData({...logData, total_miles: e.target.value})}
          required
        />
        <input
          type="number"
          placeholder="Driving Time (hours)"
          value={logData.driving_time}
          onChange={e => setLogData({...logData, driving_time: e.target.value})}
          required
        />
        <button type="submit">Add Log</button>
      </form>
    </div>
  );
};

export default LogForm;