const { Client } = require("ads-client");
const mqtt = require("mqtt");

// Configuration for the ADSclient connection from website
const client = new Client({
  targetAmsNetId: "10.193.21.105.1.1", // target AMS Net ID of PLC
  targetAdsPort: 851, // ADS port for TwinCAT not tobe changed
  localAmsNetId: "192.168.0.125.1.1", // local AMS Net ID 192.168.0.1XX where XX is the asset number
  localAdsPort: 32725, // Unique local ADS port number 327XX where XX is the asset number
  routerAddress: "192.168.0.210", // Router IP for beckoff PLC
  routerTcpPort: 48898, // Router TCP port not to be changed
});

// MQTT broker configuration
const mqttClient = mqtt.connect("mqtt://192.168.0.211", {
  port: 1883, // the MQTT broker Port #
  username: null, // Username for the MQTT not required
  password: null, // Password for the MQTT broker not required
});

// Event listener for successful MQTT connection
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker"); // Log a message when the MQTT connection is successful
});

// Event listener for MQTT connection errors
mqttClient.on("error", (err) => {
  console.error("MQTT connection error:", err.message); // Log error if the MQTT connection fails
});

// List of tags to read from the Beckhoff PLC
// Each tag represents a specific variable or parameter in the PLC program

const workCellTags = [
  "HMI_GVL.M.INITIALIZED", //boolean - system is initialized
  "HMI_GVL.M.RUNNING", //boolean - system is running
  "HMI_GVL.M.PAUSED", //boolean - system is paused
  "HMI_GVL.M.SPEEDPERCENTAGE", //numeric - percentage of full speed
  "HMI_GVL.M.SAFETY_ENABLE", //boolean - system safety relay enabled
];
const motionTagsRob1 = [
  //'HMI_GVL.M.Rob1.MACTTORQUE[0]',     // Numeric - Torque of motor 0 (Robot 1)
  "HMI_GVL.M.Rob1.MACTTORQUE[1]", // Numeric - Torque of motor 1 (Robot 1)
  "HMI_GVL.M.Rob1.MACTTORQUE[2]", // Numeric - Torque of motor 2 (Robot 1)
  "HMI_GVL.M.Rob1.MACTTORQUE[3]", // Numeric - Torque of motor 3 (Robot 1)
];
const statusTagsRob3 = [
  "HMI_GVL.M.Rob3.INITIALIZED", // Boolean - Indicates if the robot is initialized
  "HMI_GVL.M.Rob3.RUNNING", // Boolean - Indicates if the robot is running
  "HMI_GVL.M.Rob3.WSVIOLATION", // Boolean - Indicates if there is a workspace violation
  "HMI_GVL.M.Rob3.PAUSED", // Boolean - Indicates if the robot is paused
  "HMI_GVL.M.Rob3.SPEEDPERCENTAGE", // Numeric - Robot's speed percentage
  "HMI_GVL.M.Rob3.FINISHEDPARTNUM", // Numeric - Number of finished parts
];
const motionTagsRob3 = [
  "HMI_GVL.M.Rob3.ROBOTPOS.X", // Numeric - Robot's X position
  "HMI_GVL.M.Rob3.ROBOTPOS.Y", // Numeric - Robot's Y position
  "HMI_GVL.M.Rob3.ROBOTPOS.Z", // Numeric - Robot's Z position
  //'HMI_GVL.M.Rob3.MACTTORQUE[0]',     // Numeric - Torque of motor 0
  "HMI_GVL.M.Rob3.MACTTORQUE[1]", // Numeric - Torque of motor 1
  "HMI_GVL.M.Rob3.MACTTORQUE[2]", // Numeric - Torque of motor 2
  "HMI_GVL.M.Rob3.MACTTORQUE[3]", // Numeric - Torque of motor 3
];

const subscribeToTags = async (tags) => {
  for (const tag of tags) {
    try {
      client.subscribe(tag, (result) => publish(result), 500);
      //console.log(` ${sub.target}: ${data.value}, Time: ${data.timeStamp}`
    } catch (err) {
      console.error(`Error reading ${tag}:`, err.message);
    }
  }
};

const readMotionTags = async () => {
  // Use setInterval to continuously read and publish tag data at regular intervals
  setInterval(async () => {
    //create shared timestamp for motionTags
    const timestamp = new Date().toISOString();

    for (const tag of motionTagsRob3) {
      // Loop through all tags in the list
      try {
        const result = await client.readSymbol(tag); // Read value of the current tag
        //console.log(`${tag}, ${result.value}, ${new Date().toISOString()}`);
        result.timestamp = timestamp;
        publish(result);
      } catch (err) {
        console.error(`Error reading ${tag}:`, err.message);
      }
    }
  }, 1000); // interval 1 second
};

const disconnect = async () => {
  try {
    await client.disconnect();
    console.log("Disconnected from Beckhoff PLC");
    await mqttClient.disconnect();
    console.log("Disconnected from MQTT Broker");
  } catch (err) {
    console.error(err.message);
  }
};

const publish = async (data) => {
  const payload = {
    //tag: data.symbol.name, // The tag name (e.g., 'HMI_GVL.M.Rob3.RUNNING')
    value: data.value, // The value of the tag (e.g., true, 123.45)
    type: data.type.type, // The data type of the tag (e.g., 'BOOL', 'LREAL')
    timestamp: data.timestamp,
    //timestamp: new Date().toISOString(), // Current timestamp in ISO 8601 format
  };

  // Convert the tag name to a topic
  const topic = `m/conestoga/smart/pre-sorter/${data.symbol.name
    .slice(10) //cut off 'HMI_GVL.M.' from string
    .replace(/\./g, "/") //replace dots with slashes
    .toLowerCase()}`;

  // Publish the payload to the MQTT broker under the constructed topic
  mqttClient.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
    if (err) {
      console.error(`Failed to publish ${payload} to MQTT:`, err.message); // Log an error if publishing fails
    } else {
      console.log(`Published ${payload} to topic ${topic}`); // Log a success message
    }
  });
};

const main = async () => {
  process.on("SIGINT", disconnect); //disconnect on ctrl+c, graceful shutdown

  try {
    await client.connect();
    console.log("Connected to Beckhoff PLC");
    await subscribeToTags(workCellTags);
    await subscribeToTags(statusTagsRob3);
    await readMotionTags();
  } catch (err) {
    console.error("Connection error:", err.message);
  }
};

main();
