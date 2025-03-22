import React, { useState } from 'react';
import axios from 'axios';

const TripForm = () => {
    const [tripDetails, setTripDetails] = useState({
        currentLocation: '',
        pickupLocation: '',
        dropoffLocation: '',
        currentCycleUsed: 0
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await axios.post('/api/trips/', tripDetails);
        console.log(response.data);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Current Location" onChange={(e) => setTripDetails({...tripDetails, currentLocation: e.target.value})} />
            <input type="text" placeholder="Pickup Location" onChange={(e) => setTripDetails({...tripDetails, pickupLocation: e.target.value})} />
            <input type="text" placeholder="Dropoff Location" onChange={(e) => setTripDetails({...tripDetails, dropoffLocation: e.target.value})} />
            <input type="number" placeholder="Current Cycle Used (Hrs)" onChange={(e) => setTripDetails({...tripDetails, currentCycleUsed: e.target.value})} />
            <button type="submit">Submit</button>
        </form>
    );
};

export default TripForm;