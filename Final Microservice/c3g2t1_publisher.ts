import { Client, SymbolInfo } from 'ads-client'; // Import ADS client library to connect to Beckhoff PLC
import mqtt from 'mqtt'; // Import MQTT library to publish data to the MQTT broker

// Configuration for the ADS (Automation Device Specification) connection
const client = new Client({
  targetAmsNetId: '10.193.21.105.1.1', // AMS Net ID of the target PLC
  targetAdsPort: 851, // ADS port for the TwinCAT runtime
  localAmsNetId: '192.168.0.121.1.1', // AMS Net ID of the local machine
  localAdsPort: 32721, // Unique local ADS port for this client
  routerAddress: '192.168.0.210', // Beckhoff router IP
  routerTcpPort: 48898 // Default TCP port
});

// MQTT broker configuration
const mqttClient = mqtt.connect('mqtt://192.168.0.211', {
  port: 1883,         // MQTT broker port
  username: undefined, // Username for MQTT broker (set to undefined if not required)
  password: undefined  // Password for MQTT broker (set to undefined if not required)
});

// Event listener for successful MQTT connection
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker'); // Log a message when the MQTT connection is successful
});

// Event listener for MQTT connection errors
mqttClient.on('error', (err) => {
  console.error('MQTT connection error:', err.message); // Log an error if the MQTT connection fails
});

// Tags grouped by type
const tags = {
  status: [
    'HMI_GVL.M.Rob3.INITIALIZED',       // Boolean - Indicates if the robot is initialized
    'HMI_GVL.M.Rob3.RUNNING',           // Boolean - Indicates if the robot is running
    'HMI_GVL.M.Rob3.WSVIOLATION',       // Boolean - Indicates if there is a workspace violation
    'HMI_GVL.M.Rob3.PAUSED',            // Boolean - Indicates if the robot is paused
    'HMI_GVL.M.Rob3.SPEEDPERCENTAGE',   // Numeric - Robot's speed percentage
    'HMI_GVL.M.Rob3.FINISHEDPARTNUM'    // Numeric - Number of finished parts
  ],
  motorPositions: [
    'HMI_GVL.M.Rob3.ROBOTPOS.X',        // Numeric - Robot's X position
    'HMI_GVL.M.Rob3.ROBOTPOS.Y',        // Numeric - Robot's Y position
    'HMI_GVL.M.Rob3.ROBOTPOS.Z'         // Numeric - Robot's Z position
  ],
  motorTorques: [
    'HMI_GVL.M.Rob3.MACTTORQUE[1]',     // Numeric - Torque of motor 1
    'HMI_GVL.M.Rob3.MACTTORQUE[2]',     // Numeric - Torque of motor 2
    'HMI_GVL.M.Rob3.MACTTORQUE[3]'      // Numeric - Torque of motor 3
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

// Function to read tags and publish them as per their respective requirements
const readAndPublishTags = async (): Promise<void> => {
  try {
    // Connect to the Beckhoff PLC
    await client.connect();
    console.log('Connected to Beckhoff PLC');

    // Set up an interval to periodically read and publish data
    setInterval(async () => {
      const getLocalTimestamp = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000; // Offset in milliseconds
        const localTime = new Date(now.getTime() - offset);
        return localTime.toISOString().replace('T', ' ').replace('Z', '');
      };

      const timestamp = getLocalTimestamp();

      // Publish status tags only when their values change
      for (const tag of tags.status) {
        try {
          const result: SymbolInfo = await client.readSymbol(tag);
          const currentValue = result.value;

          // Publish only if the value has changed
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
