export enum MetricsDataType {
  COUNTER = 'COUNTER',
  GAUGE = 'GAUGE',
  HISTOGRAM = 'HISTOGRAM',
  SUMMARY = 'SUMMARY',
}

export enum MetricName {
  HTTP_DURATION = 'http_request_duration_seconds',
}

export enum MetricTraffic {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}
