import type { NormalizedInput, BrokerResult, BrokerRegistry, BrokerRegistryEntry } from '../types/index.js';
import { RadarisBroker } from './radaris.js';
import { SpokeoBroker } from './spokeo.js';
import { YellowPagesBroker } from './yellowpages.js';
import { BrowserBaseBroker } from './browser-base.js';
import { browserManager } from './browser-manager.js';

// Import the broker registry
import registry from '../brokers.registry.json' with { type: 'json' };

// Re-export browser manager for cleanup
export { browserManager };

/**
 * Map of broker IDs to their implementation classes
 * Only includes brokers that have been tested and verified to work
 */
const brokerImplementations: Record<string, new (config: BrokerRegistryEntry) => BrowserBaseBroker> = {
  radaris: RadarisBroker,
  spokeo: SpokeoBroker,
  yellowpages: YellowPagesBroker,
};

/**
 * Get all active brokers from the registry
 */
function getActiveBrokers(): BrokerRegistryEntry[] {
  const typedRegistry = registry as BrokerRegistry;
  return typedRegistry.brokers.filter(broker => broker.status === 'active');
}

/**
 * Search all active brokers for a person
 * Searches are executed sequentially (MVP - no parallel requests)
 * Each broker has its own timeout; failures don't block other brokers
 */
export async function searchAllBrokers(input: NormalizedInput): Promise<BrokerResult[]> {
  const activeBrokers = getActiveBrokers();
  const results: BrokerResult[] = [];

  for (const brokerConfig of activeBrokers) {
    const BrokerClass = brokerImplementations[brokerConfig.id];
    
    if (!BrokerClass) {
      // Broker in registry but no implementation yet
      results.push({
        brokerId: brokerConfig.id,
        brokerName: brokerConfig.name,
        found: false,
        exposedFields: [],
        riskLevel: 'low',
        notes: 'Broker integration pending',
      });
      continue;
    }

    const broker = new BrokerClass(brokerConfig);
    const result = await broker.search(input);
    results.push(result);
  }

  return results;
}

/**
 * Get broker registry metadata
 */
export function getBrokerRegistry(): BrokerRegistry {
  return registry as BrokerRegistry;
}
