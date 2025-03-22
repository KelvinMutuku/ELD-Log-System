import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TripList = () => {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await axios.get('/api/trips/');
        setTrips(response.data);
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };
    fetchTrips();
  }, []);

  return (
    <div className="trip-list">
      <h2>All Trips</h2>
      {trips.map(trip => (
        <div key={trip.id} className="trip-card">
          <h3>Trip #{trip.id}</h3>
          <p>From: {trip.pickup_location}</p>
          <p>To: {trip.dropoff_location}</p>
          <Link to={`/trips/${trip.id}/logs`}>View Logs</Link>
        </div>
      ))}
    </div>
  );
};

export default TripList;