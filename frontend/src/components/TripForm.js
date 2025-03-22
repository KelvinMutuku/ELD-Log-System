import React, { useState } from 'react';
import axios from 'axios';

const TripForm = ({ onTripCreated }) => {
  const [formData, setFormData] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/trips/', formData);
      onTripCreated(response.data);
      setFormData({
        current_location: '',
        pickup_location: '',
        dropoff_location: '',
        current_cycle_used: 0
      });
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  return (
    <div className="form-container">
      <h2>Create New Trip</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Current Location"
          value={formData.current_location}
          onChange={e => setFormData({...formData, current_location: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Pickup Location"
          value={formData.pickup_location}
          onChange={e => setFormData({...formData, pickup_location: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Dropoff Location"
          value={formData.dropoff_location}
          onChange={e => setFormData({...formData, dropoff_location: e.target.value})}
          required
        />
        <input
          type="number"
          placeholder="Current Cycle Used"
          value={formData.current_cycle_used}
          onChange={e => setFormData({...formData, current_cycle_used: e.target.value})}
          required
        />
        <button type="submit">Create Trip</button>
      </form>
    </div>
  );
};

export default TripForm;