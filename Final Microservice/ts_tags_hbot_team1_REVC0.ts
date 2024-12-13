// Import required modules
// Import ADS client library to connect to Beckhoff PLC
import { Client, SymbolInfo } from 'ads-client';
// Import MQTT library to publish data to the MQTT broker
import mqtt from 'mqtt';

// Configuration for the ADS connection
const client = new Client({
  targetAmsNetId: '10.193.21.105.1.1', // Target PLC AMS Net ID
  targetAdsPort: 851, // TwinCAT runtime ADS port
  localAmsNetId: '192.168.0.121.1.1', // Local machine AMS Net ID
  localAdsPort: 32721, // Unique local ADS port
  routerAddress: '192.168.0.210', // Beckhoff router IP
  routerTcpPort: 48898 // Default Beckhoff router TCP port
});

// MQTT broker configuration
const mqttClient = mqtt.connect('mqtt://192.168.0.211', {
  port: 1883, // MQTT broker port
  username: undefined, // MQTT broker username (optional)
  password: undefined // MQTT broker password (optional)
});

// Event listener for successful MQTT connection
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
});

// Event listener for MQTT connection errors
mqttClient.on('error', (err) => {
  console.error('MQTT connection error:', err.message);
});

// Tags grouped by type
const tags = {
  status: [
    'HMI_GVL.M.Rob3.INITIALIZED',
    'HMI_GVL.M.Rob3.RUNNING',
    'HMI_GVL.M.Rob3.WSVIOLATION',
    'HMI_GVL.M.Rob3.PAUSED',
    'HMI_GVL.M.Rob3.SPEEDPERCENTAGE',
    'HMI_GVL.M.Rob3.FINISHEDPARTNUM'
  ],
  motorPositions: [
    'HMI_GVL.M.Rob3.ROBOTPOS.X',
    'HMI_GVL.M.Rob3.ROBOTPOS.Y',
    'HMI_GVL.M.Rob3.ROBOTPOS.Z'
  ],
  motorTorques: [
    'HMI_GVL.M.Rob3.MACTTORQUE[1]',
    'HMI_GVL.M.Rob3.MACTTORQUE[2]',
    'HMI_GVL.M.Rob3.MACTTORQUE[3]'
  ]
};

// Interfaces for payloads
interface IndividualPayload {
  timestamp: string;
  tag: string;
  value: number | boolean | string;
}

interface GroupPayload {
  timestamp: string;
  data: Record<string, number>;
}

// Object to track previously published status values
const previousStatusValues: Record<string, number | boolean | string> = {};

// Function to read tags and publish them
const readAndPublishTags = async (): Promise<void> => {
  try {
    // Connect to the Beckhoff PLC
    await client.connect();
    console.log('Connected to Beckhoff PLC');

    // Set up an interval to periodically read and publish data
    setInterval(async () => {
      const timestamp = new Date().toISOString();

      // Publish status tags only when their values change
      for (const tag of tags.status) {
        try {
          const result: SymbolInfo = await client.readSymbol(tag);
          const currentValue = result.value;

          if (previousStatusValues[tag] !== currentValue) {
            previousStatusValues[tag] = currentValue;
            const payload: IndividualPayload = { timestamp, tag, value: currentValue };
            const topic = `IoT_Academy/c3g2t1/robot3/motors/status/${tag.split('.').pop()!.toLowerCase()}`;
            mqttClient.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
              if (err) {
                console.error(`Error publishing status tag ${tag}:`, err.message);
              } else {
                console.log(`Published status tag ${tag} to topic ${topic}:`, payload);
              }
            });
          }
        } catch (err) {
          console.error(`Error reading status tag ${tag}:`, err.message);
        }
      }

      // Read and publish motor positions as a group
      let motorPositionData: Record<string, number> = {};
      for (const tag of tags.motorPositions) {
        try {
          const result: SymbolInfo = await client.readSymbol(tag);
          motorPositionData[tag.split('.').pop()!] = result.value;
        } catch (err) {
          console.error(`Error reading motor position tag ${tag}:`, err.message);
        }
      }
      const motorPositionPayload: GroupPayload = { timestamp, data: motorPositionData };
      mqttClient.publish('IoT_Academy/c3g2t1/robot3/motors/positions/', JSON.stringify(motorPositionPayload), { qos: 0 }, (err) => {
        if (err) {
          console.error('Error publishing motor positions:', err.message);
        } else {
          console.log('Published motor positions:', motorPositionPayload);
        }
      });

      // Read and publish motor torques as a group
      let motorTorqueData: Record<string, number> = {};
      for (const tag of tags.motorTorques) {
        try {
          const result: SymbolInfo = await client.readSymbol(tag);
          motorTorqueData[tag.split('.').pop()!] = result.value;
        } catch (err) {
          console.error(`Error reading motor torque tag ${tag}:`, err.message);
        }
      }
      const motorTorquePayload: GroupPayload = { timestamp, data: motorTorqueData };
      mqttClient.publish('IoT_Academy/c3g2t1/robot3/motors/torques/', JSON.stringify(motorTorquePayload), { qos: 0 }, (err) => {
        if (err) {
          console.error('Error publishing motor torques:', err.message);
        } else {
          console.log('Published motor torques:', motorTorquePayload);
        }
      });
    }, 1000); // Set the interval to 1 second
  } catch (err) {
    console.error('Connection error:', err.message);
  }
};

// Start the process
readAndPublishTags();
