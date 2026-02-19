import { DataSourceAdapter } from '../../types/index.js';
import { OpenSkyAdapter } from './opensky.adapter.js';
import { ADSBExchangeAdapter } from './adsbexchange.adapter.js';
import { AviationStackAdapter } from './aviationstack.adapter.js';
import { config } from '../../config.js';

export class DataSourceManager {
  private adapters: DataSourceAdapter[] = [];

  constructor() {
    this.initializeAdapters();
  }

  private initializeAdapters() {
    // OpenSky Network (free, no key required)
    this.adapters.push(
      new OpenSkyAdapter(config.apiKeys.openskyUsername, config.apiKeys.openskyPassword)
    );

    // ADS-B Exchange (requires API key)
    if (config.apiKeys.adsbexchange) {
      this.adapters.push(new ADSBExchangeAdapter(config.apiKeys.adsbexchange));
    }

    // AviationStack (requires API key)
    if (config.apiKeys.aviationstack) {
      this.adapters.push(new AviationStackAdapter(config.apiKeys.aviationstack));
    }
  }

  getAdapters(): DataSourceAdapter[] {
    return this.adapters;
  }

  getAdapter(name: string): DataSourceAdapter | undefined {
    return this.adapters.find((adapter) => adapter.name === name);
  }
}

export const dataSourceManager = new DataSourceManager();
