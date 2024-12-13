import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define the type for our robot data
interface RobotData {
  timestamp: string;
  hbot_x: string;
  hbot_y: string;
  hbot_z: string;
  hbot_torq1: string;
  hbot_torq2: string;
  hbot_torq3: string;
}

const RobotVisualization = () => {
  const [data, setData] = useState<RobotData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://192.168.0.123:3001/robot3_data');
        // Convert string values to numbers for the chart
        const processedData = response.data.map((item: RobotData) => ({
          ...item,
          hbot_x: parseFloat(item.hbot_x),
          hbot_y: parseFloat(item.hbot_y),
          hbot_z: parseFloat(item.hbot_z),
          hbot_torq1: parseFloat(item.hbot_torq1),
          hbot_torq2: parseFloat(item.hbot_torq2),
          hbot_torq3: parseFloat(item.hbot_torq3),
        }));
        setData(processedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    // Set up polling every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Robot Data Visualization</h1>
      
      {/* Position Chart */}
      <div className="mb-8 h-96">
        <h2 className="text-xl font-semibold mb-2">Position Data</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tick={false}
              label={{ value: 'Time', position: 'bottom' }} 
            />
            <YAxis label={{ value: 'Position', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="hbot_x" stroke="#8884d8" name="X Position" dot={false} />
            <Line type="monotone" dataKey="hbot_y" stroke="#82ca9d" name="Y Position" dot={false} />
            <Line type="monotone" dataKey="hbot_z" stroke="#ffc658" name="Z Position" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Torque Chart */}
      <div className="h-96">
        <h2 className="text-xl font-semibold mb-2">Torque Data</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tick={false}
              label={{ value: 'Time', position: 'bottom' }} 
            />
            <YAxis label={{ value: 'Torque', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="hbot_torq1" stroke="#ff7300" name="Torque 1" dot={false} />
            <Line type="monotone" dataKey="hbot_torq2" stroke="#ff0000" name="Torque 2" dot={false} />
            <Line type="monotone" dataKey="hbot_torq3" stroke="#0088fe" name="Torque 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RobotVisualization;