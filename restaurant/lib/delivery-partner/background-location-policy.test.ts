import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  dropExpired,
  isBackgroundTripStatus,
  isUsableAccuracy,
  nextDelayMs,
  pushFix,
  shouldSampleFix,
  type QueuedFix,
} from './background-location-policy';

const fix = (over: Partial<QueuedFix> = {}): QueuedFix => ({
  latitude: 28.61,
  longitude: 77.21,
  timestamp: 1_000_000,
  ...over,
});

describe('background trip status', () => {
  it('starts at accept and runs through a return', () => {
    assert.equal(isBackgroundTripStatus('assigned'), false);
    assert.equal(isBackgroundTripStatus('accepted'), true);
    assert.equal(isBackgroundTripStatus('arrived'), true);
    assert.equal(isBackgroundTripStatus('picked_up'), true);
    assert.equal(isBackgroundTripStatus('out_for_delivery'), true);
    assert.equal(isBackgroundTripStatus('at_customer'), true);
    assert.equal(isBackgroundTripStatus('returning_to_restaurant'), true);
  });

  it('stops when the trip is finished', () => {
    for (const status of ['delivered', 'returned', 'cancelled', 'reassigned', 'failed']) {
      assert.equal(isBackgroundTripStatus(status), false);
    }
    assert.equal(isBackgroundTripStatus(null), false);
  });
});

describe('background sampling', () => {
  it('sends a trip fix every 4s, stopped or moving', () => {
    const previous = { latitude: 28.61, longitude: 77.21, at: 1_000_000 };
    assert.equal(
      shouldSampleFix(previous, fix({ timestamp: 1_000_000 + 3_000 })),
      false,
    );
    assert.equal(
      shouldSampleFix(previous, fix({ timestamp: 1_000_000 + 4_000 })),
      true,
    );
    assert.equal(
      shouldSampleFix(previous, fix({
        latitude: 28.6102,
        timestamp: 1_000_000 + 4_000,
      })),
      true,
    );
  });

  it('pings every 10s while online without a trip, moving or not', () => {
    const previous = { latitude: 28.61, longitude: 77.21, at: 1_000_000 };
    const moved = { latitude: 28.62, timestamp: 1_000_000 + 5_000 };
    assert.equal(shouldSampleFix(previous, fix(moved), 'idle'), false);
    assert.equal(
      shouldSampleFix(previous, fix({ timestamp: 1_000_000 + 10_000 }), 'idle'),
      true,
    );
  });

  it('drops poor accuracy and keeps the original timestamp on queued fixes', () => {
    assert.equal(isUsableAccuracy(81), false);
    assert.equal(isUsableAccuracy(12), true);
    const queued = pushFix(
      [fix({ timestamp: 10 })],
      fix({ timestamp: 20 }),
    );
    assert.equal(queued[1]?.timestamp, 20);
    const kept = dropExpired(
      [fix({ timestamp: 0 }), fix({ timestamp: 50_000 })],
      130_000,
    );
    assert.equal(kept.length, 1);
    assert.equal(kept[0]?.timestamp, 50_000);
  });

  it('backs off with jitter and never returns a negative delay', () => {
    assert.equal(nextDelayMs(0, () => 0), 1_000);
    assert.equal(nextDelayMs(5, () => 0), 30_000);
    assert.ok(nextDelayMs(1, () => 0.5) > 2_000);
  });
});
