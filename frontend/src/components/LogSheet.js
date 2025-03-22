import React from 'react';

const LogSheet = ({ log }) => {
    return (
        <div>
            <h3>Log Sheet for {log.date}</h3>
            <p>Total Miles: {log.total_miles}</p>
            <p>Driving Time: {log.driving_time}</p>
            <p>On Duty Time: {log.on_duty_time}</p>
            <p>Off Duty Time: {log.off_duty_time}</p>
        </div>
    );
};

export default LogSheet;