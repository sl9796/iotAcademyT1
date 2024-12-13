import mqtt from 'mqtt';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '192.168.0.211',
  database: 'academy21',
  password: 'academy2024!',
  port: 3306
});

const mqttClient = mqtt.connect('mqtt://192.168.0.211', {
  port: 1883,
  username: undefined,
  password: undefined
});

// Function to insert initial status values
async function insertInitialStatus() {
  const initialStatusValues = [
    { tag: 'HMI_GVL.M.Rob3.INITIALIZED', value: false },
    { tag: 'HMI_GVL.M.Rob3.RUNNING', value: false },
    { tag: 'HMI_GVL.M.Rob3.WSVIOLATION', value: false },
    { tag: 'HMI_GVL.M.Rob3.PAUSED', value: false },
    { tag: 'HMI_GVL.M.Rob3.SPEEDPERCENTAGE', value: 0 },
    { tag: 'HMI_GVL.M.Rob3.FINISHEDPARTNUM', value: 0 }
  ];

  for (const status of initialStatusValues) {
    const query = `
      INSERT INTO robot3_status (tag_name, rob3_status, timestamp_ts)
      VALUES ($1, $2, $3)
    `;
    
    const timestamp = new Date().toISOString();
    const values = [status.tag, status.value.toString(), timestamp];
    
    try {
      await pool.query(query, values);
      console.log(`Inserted initial status for ${status.tag}`);
    } catch (error) {
      console.error(`Error inserting initial status for ${status.tag}:`, error);
    }
  }
}

interface GroupPayload {
  timestamp: string;
  data: {
    X?: number;
    Y?: number;
    Z?: number;
    'MACTTORQUE[1]'?: number;
    'MACTTORQUE[2]'?: number;
    'MACTTORQUE[3]'?: number;
  };
}

interface StatusPayload {
  timestamp: string;
  tag: string;
  value: boolean | number;
}

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Insert initial status values
  insertInitialStatus();
  
  mqttClient.subscribe([
    'IoT_Academy/c3g2t1/robot3/motors/positions/',
    'IoT_Academy/c3g2t1/robot3/motors/torques/',
    'IoT_Academy/c3g2t1/robot3/motors/status/+'
  ], (err) => {
    if (!err) {
      console.log('Subscribed to topics');
    }
  });
});

mqttClient.on('message', async (topic, message) => {
  try {
    if (topic.includes('status/')) {
      const statusPayload: StatusPayload = JSON.parse(message.toString());
      const query = `
        INSERT INTO robot3_status (tag_name, rob3_status, timestamp_ts)
        VALUES ($1, $2, $3)
      `;
      
      const values = [
        statusPayload.tag,
        statusPayload.value.toString(),
        statusPayload.timestamp
      ];
      
      await pool.query(query, values);
      console.log('Updated status:', values);
      return;
    }

    const payload: GroupPayload = JSON.parse(message.toString());
    
    if (topic === 'IoT_Academy/c3g2t1/robot3/motors/positions/') {
      const query = `
        INSERT INTO "robot3_data" (hbot_x, hbot_y, hbot_z, timestamp)
        VALUES ($1, $2, $3, $4)
      `;
      
      const values = [
        payload.data.X?.toString() || '0',
        payload.data.Y?.toString() || '0',
        payload.data.Z?.toString() || '0',
        payload.timestamp
      ];
      
      await pool.query(query, values);
      console.log('Inserted position data:', values);
      
    } else if (topic === 'IoT_Academy/c3g2t1/robot3/motors/torques/') {
      const query = `
        UPDATE "robot3_data"
        SET hbot_torq1 = $1,
            hbot_torq2 = $2,
            hbot_torq3 = $3
        WHERE timestamp = $4
      `;
      
      const values = [
        payload.data['MACTTORQUE[1]']?.toString() || '0',
        payload.data['MACTTORQUE[2]']?.toString() || '0',
        payload.data['MACTTORQUE[3]']?.toString() || '0',
        payload.timestamp
      ];
      
      await pool.query(query, values);
      console.log('Updated torque data:', values);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

mqttClient.on('error', (error) => {
  console.error('MQTT Error:', error);
});

pool.on('error', (error) => {
  console.error('Database Error:', error);
});

process.on('SIGINT', async () => {
  console.log('Closing connections...');
  mqttClient.end();
  await pool.end();
  process.exit(0);
});