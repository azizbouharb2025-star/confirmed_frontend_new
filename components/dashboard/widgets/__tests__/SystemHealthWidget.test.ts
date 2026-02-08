/**
 * Feature: subscription-tiered-dashboards, Property 10: System health shows all services
 * Validates: Requirements 8.4
 * 
 * Property: For any system health data, the widget SHALL display status indicators 
 * for API, database, and queue services.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  hasAllRequiredServices, 
  REQUIRED_SERVICES,
  ServiceHealth, 
  ServiceStatus 
} from '../SystemHealthWidget';

/**
 * Arbitrary for generating valid ServiceStatus
 */
const serviceStatusArb: fc.Arbitrary<ServiceStatus> = fc.constantFrom('healthy', 'degraded', 'down');

/**
 * Arbitrary for generating valid ISO date strings
 * Using integer timestamps to avoid Invalid Date errors
 */
const validDateArb: fc.Arbitrary<string> = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime(),
}).map(ts => new Date(ts).toISOString());

/**
 * Arbitrary for generating valid ServiceHealth
 */
const serviceHealthArb: fc.Arbitrary<ServiceHealth> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  status: serviceStatusArb,
  latency: fc.option(fc.integer({ min: 1, max: 5000 }), { nil: undefined }),
  lastCheck: validDateArb,
});

/**
 * Arbitrary for generating services array that includes all required services
 */
const servicesWithRequiredArb: fc.Arbitrary<ServiceHealth[]> = fc.tuple(
  // Required services
  fc.record({
    name: fc.constant('API'),
    status: serviceStatusArb,
    latency: fc.option(fc.integer({ min: 1, max: 5000 }), { nil: undefined }),
    lastCheck: validDateArb,
  }),
  fc.record({
    name: fc.constant('Database'),
    status: serviceStatusArb,
    latency: fc.option(fc.integer({ min: 1, max: 5000 }), { nil: undefined }),
    lastCheck: validDateArb,
  }),
  fc.record({
    name: fc.constant('Queue'),
    status: serviceStatusArb,
    latency: fc.option(fc.integer({ min: 1, max: 5000 }), { nil: undefined }),
    lastCheck: validDateArb,
  }),
  // Optional additional services
  fc.array(serviceHealthArb, { minLength: 0, maxLength: 5 })
).map(([api, db, queue, additional]) => [api, db, queue, ...additional]);


/**
 * Arbitrary for generating services array missing at least one required service
 */
const servicesMissingRequiredArb: fc.Arbitrary<ServiceHealth[]> = fc.array(
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(
      name => !REQUIRED_SERVICES.some(req => name.toLowerCase().includes(req.toLowerCase()))
    ),
    status: serviceStatusArb,
    latency: fc.option(fc.integer({ min: 1, max: 5000 }), { nil: undefined }),
    lastCheck: fc.date().map(d => d.toISOString()),
  }),
  { minLength: 0, maxLength: 5 }
);

describe('SystemHealthWidget - Property Tests', () => {
  /**
   * Property 10: System health shows all services
   * For any services array containing API, Database, and Queue,
   * hasAllRequiredServices SHALL return true
   */
  it('Property 10: hasAllRequiredServices returns true when all required services present', () => {
    fc.assert(
      fc.property(servicesWithRequiredArb, (services) => {
        return hasAllRequiredServices(services) === true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: hasAllRequiredServices returns false when required services are missing
   */
  it('hasAllRequiredServices returns false when required services are missing', () => {
    fc.assert(
      fc.property(servicesMissingRequiredArb, (services) => {
        return hasAllRequiredServices(services) === false;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Service status is always one of the valid values
   */
  it('service status is always valid (healthy, degraded, or down)', () => {
    fc.assert(
      fc.property(serviceHealthArb, (service) => {
        return ['healthy', 'degraded', 'down'].includes(service.status);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Latency when present is always a positive number
   */
  it('latency when present is always positive', () => {
    fc.assert(
      fc.property(serviceHealthArb, (service) => {
        if (service.latency === undefined) return true;
        return service.latency > 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Required services constant has exactly 3 services
   */
  it('REQUIRED_SERVICES has exactly 3 services', () => {
    expect(REQUIRED_SERVICES.length).toBe(3);
    expect(REQUIRED_SERVICES).toContain('API');
    expect(REQUIRED_SERVICES).toContain('Database');
    expect(REQUIRED_SERVICES).toContain('Queue');
  });
});

describe('SystemHealthWidget - Unit Tests', () => {
  it('returns true when all required services are present', () => {
    const services: ServiceHealth[] = [
      { name: 'API', status: 'healthy', latency: 50, lastCheck: new Date().toISOString() },
      { name: 'Database', status: 'healthy', latency: 10, lastCheck: new Date().toISOString() },
      { name: 'Queue', status: 'healthy', latency: 5, lastCheck: new Date().toISOString() },
    ];
    expect(hasAllRequiredServices(services)).toBe(true);
  });

  it('returns true when services have different casing', () => {
    const services: ServiceHealth[] = [
      { name: 'api-server', status: 'healthy', lastCheck: new Date().toISOString() },
      { name: 'DATABASE_PRIMARY', status: 'healthy', lastCheck: new Date().toISOString() },
      { name: 'Message Queue', status: 'healthy', lastCheck: new Date().toISOString() },
    ];
    expect(hasAllRequiredServices(services)).toBe(true);
  });

  it('returns false when API service is missing', () => {
    const services: ServiceHealth[] = [
      { name: 'Database', status: 'healthy', lastCheck: new Date().toISOString() },
      { name: 'Queue', status: 'healthy', lastCheck: new Date().toISOString() },
    ];
    expect(hasAllRequiredServices(services)).toBe(false);
  });

  it('returns false when Database service is missing', () => {
    const services: ServiceHealth[] = [
      { name: 'API', status: 'healthy', lastCheck: new Date().toISOString() },
      { name: 'Queue', status: 'healthy', lastCheck: new Date().toISOString() },
    ];
    expect(hasAllRequiredServices(services)).toBe(false);
  });

  it('returns false when Queue service is missing', () => {
    const services: ServiceHealth[] = [
      { name: 'API', status: 'healthy', lastCheck: new Date().toISOString() },
      { name: 'Database', status: 'healthy', lastCheck: new Date().toISOString() },
    ];
    expect(hasAllRequiredServices(services)).toBe(false);
  });

  it('returns false for empty services array', () => {
    expect(hasAllRequiredServices([])).toBe(false);
  });

  it('returns true with additional services beyond required', () => {
    const services: ServiceHealth[] = [
      { name: 'API', status: 'healthy', lastCheck: new Date().toISOString() },
      { name: 'Database', status: 'healthy', lastCheck: new Date().toISOString() },
      { name: 'Queue', status: 'healthy', lastCheck: new Date().toISOString() },
      { name: 'Cache', status: 'healthy', lastCheck: new Date().toISOString() },
      { name: 'CDN', status: 'degraded', lastCheck: new Date().toISOString() },
    ];
    expect(hasAllRequiredServices(services)).toBe(true);
  });
});
