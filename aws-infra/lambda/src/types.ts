
export interface LogEvent {
  id: string
  timestamp: number
  message: string
}

export interface MetricEvent {
  MetricName: string
  Timestamp: Date
  Value: number
}
