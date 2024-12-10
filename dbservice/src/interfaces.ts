
//interface for plc tag objects in config.json
export interface Iplctag {
    name: string
    machine: string
    type: string
    attribute: string
}

export interface IMQTTSimplePayload {
    value: number
    type: string
    timestamp: string
}

export interface IMQTTMotionPayload {
    position_x?: number;
    position_y?: number;
    position_z?: number;
    torque_1?: number;
    torque_2?: number;
    torque_3?: number;
    timestamp: string;
}