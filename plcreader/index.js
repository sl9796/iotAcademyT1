const { Client } = require('ads-client');

// Configuration for the ADSclient connection from website
const client = new Client({
  targetAmsNetId: '10.193.21.105.1.1', // target AMS Net ID of PLC
  targetAdsPort: 851,                  // ADS port for TwinCAT not tobe changed
  localAmsNetId: '192.168.0.125.1.1',  // My local AMS Net ID with asset number 21
  localAdsPort: 32725,                 // Unique local ADS port number not to be changed
  routerAddress: '192.168.0.210',      // Router IP for beckoff PLC
  routerTcpPort: 48898                 // Router TCP port not to be changed
});

// List of tags to read
const tags = [
  'HMI_GVL.M.Rob3.INITIALIZED', // H-Bot is initialized
  'HMI_GVL.M.Rob3.RUNNING', // H-Bot is running
  'HMI_GVL.M.Rob3.WSVIOLATION', // H-Bot workspace violation
  'HMI_GVL.M.Rob3.PAUSED', // H-Bot is paused
  'HMI_GVL.M.Rob3.SPEEDPERCENTAGE', //H-Bot percentage of full speed
  'HMI_GVL.M.Rob3.FINISHEDPARTNUM', //H-Bot count of completed operations
  'HMI_GVL.M.Rob3.ROBOTPOS.X', //H-Bot positions
  'HMI_GVL.M.Rob3.ROBOTPOS.Y', //H-Bot positions
  'HMI_GVL.M.Rob3.ROBOTPOS.Z', //H-Bot positions
  //'HMI_GVL.M.Rob3.MACTTORQUE.MACTTORQUE' //Array of H-Bot torque values
  'HMI_GVL.M.Rob3.MACTTORQUE.MACTTORQUE[1]', //H-Bot torque
  //'HMI_GVL.M.Rob3.MACTTORQUE.MACTTORQUE[2]',//H-Bot torque
  //'HMI_GVL.M.Rob3.MACTTORQUE.MACTTORQUE[3]'//H-Bot torque
];

// Function to read tags
const readTags = async () => {
  try {
    await client.connect();
    console.log('Connected to Beckhoff PLC');

    for (const tag of tags) {
      try {
        const value = await client.readSymbol(tag);
        console.log(`${tag}:`, value);
      } catch (err) {
        console.error(`Error reading ${tag}:`, err.message);
      }
    }

    await client.disconnect();
    console.log('Disconnected from Beckhoff PLC');
  } catch (err) {
    console.error('Connection error:', err.message);
  }
};

// Execute the function
readTags();
