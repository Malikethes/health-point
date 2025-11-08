// Defines the *kind* of visualization we want to render
export type VisualizationType =
  | 'line'
  | 'bar'
  | 'area'
  | 'radial'
  | 'stacked-bar'
  | 'progress';

// This is our individual parameter data structure
export interface SensorData {
  id: string;
  name: string;
  currentValue: string;
  visualizationType: VisualizationType;
  payload: any;
  aiInsight?: string; // Optional (will be fetched)
}

// This is the NEW structure for the sensor *point*
export interface SensorPointData {
  pointId: string;
  pointName: string;
  parameters: SensorData[];
}