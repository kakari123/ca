
export interface Violation {
  id: string;
  plateNumber: string;
  speed: number;
  speedLimit: number;
  timestamp: string;
  imagePath: string;
}

export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  SOURCE_CODE = 'SOURCE_CODE',
  LIVE_CALIBRATION = 'LIVE_CALIBRATION'
}

export interface Detection {
  id: number;
  y: number;
  timestamp: number;
  speed?: number;
  done: boolean;
}
