import { Injectable, NotFoundException } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  CounterConfiguration,
  Gauge,
  GaugeConfiguration,
  Histogram,
  HistogramConfiguration,
  Metric,
  register,
  Registry,
  Summary,
  SummaryConfiguration,
} from 'prom-client';
import { MetricName, MetricsDataType } from './metrics.enum';

@Injectable()
export class MetricsService {
  private register: Registry;
  private static metrics: Map<string, Metric<any>> = new Map();

  public constructor() {
    this.setupRegistry();
    this.setupMetrics();
  }

  /**
   * Collect metrics for prometheus.
   */
  public async collectMetrics(): Promise<any> {
    return Registry.merge([this.register, register]).metrics();
  }

  /**
   * Setup custom metrics used by application.
   */
  private setupMetrics(): void {
    this.getHistogram(MetricName.HTTP_DURATION, {
      help: 'Histogram for request duration in seconds',
      labelNames: ['traffic', 'method', 'status', 'baseUrl', 'url'],
    });
  }

  /**
   * Create Prometheus metrics registry and built-in histograms.
   */
  private setupRegistry(): void {
    this.register = new Registry();
    this.register.setDefaultLabels({ environment: 'dev' });

    collectDefaultMetrics({
      register: this.register,
      prefix: 'example_',
    });
  }

  /**
   * Gets metric by name creating if necessary.
   * @param type
   * @param rawName
   * @param params
   */
  private getMetrics(type: MetricsDataType, rawName: string, params: any): any {
    const name = `example_${rawName}`;

    let metric = MetricsService.metrics.get(name);
    if (metric) return metric;

    if (!params) {
      throw new NotFoundException(
        `cannot get metric ${name} since it was never initialized`,
      );
    }

    switch (type) {
      case MetricsDataType.COUNTER:
        metric = new Counter({ name, ...params } as CounterConfiguration<any>);
        break;

      case MetricsDataType.GAUGE:
        metric = new Gauge({ name, ...params } as GaugeConfiguration<any>);
        break;

      case MetricsDataType.HISTOGRAM:
        metric = new Histogram({
          name,
          ...params,
        } as HistogramConfiguration<any>);
        break;

      case MetricsDataType.SUMMARY:
        metric = new Summary({ name, ...params } as SummaryConfiguration<any>);
        break;
    }

    this.register.registerMetric(metric);
    MetricsService.metrics.set(name, metric);

    return metric;
  }

  /**
   * Gets or create a counter by name.
   * Counters go up, and reset when the process restarts.
   * @param name
   * @param params
   */
  public getCounter<T extends string>(
    name: string,
    params?: Omit<CounterConfiguration<string>, 'name'>,
  ): Counter<T> {
    return this.getMetrics(MetricsDataType.COUNTER, name, params);
  }

  /**
   * Gets or create a gauge by name.
   * Gauges can go up or down, and reset when the process restarts.
   * @param name
   * @param params
   */
  public getGauge<T extends string>(
    name: string,
    params?: Omit<GaugeConfiguration<string>, 'name'>,
  ): Gauge<T> {
    return this.getMetrics(MetricsDataType.GAUGE, name, params);
  }

  /**
   * Gets or create a histogram by name.
   * Histograms track sizes and frequency of events.
   * @param name
   * @param params
   */
  public getHistogram<T extends string>(
    name: string,
    params?: Omit<HistogramConfiguration<string>, 'name'>,
  ): Histogram<T> {
    const buckets = [
      0.001, 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 3, 5,
      10,
    ];

    if (!params?.buckets) {
      params = {
        ...params,
        buckets,
      };
    }

    return this.getMetrics(MetricsDataType.HISTOGRAM, name, params);
  }

  /**
   * Gets or create a summary by name.
   * Summaries calculate percentiles of observed values.
   * @param name
   * @param params
   */
  public getSummary<T extends string>(
    name: string,
    params?: Omit<SummaryConfiguration<string>, 'name'>,
  ): Summary<T> {
    return this.getMetrics(MetricsDataType.SUMMARY, name, params);
  }
}
