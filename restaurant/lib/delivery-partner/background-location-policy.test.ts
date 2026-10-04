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
  it('starts only after pickup and through a return', () => {
    assert.equal(isBackgroundTripStatus('assigned'), false);
    assert.equal(isBackgroundTripStatus('accepted'), false);
    assert.equal(isBackgroundTripStatus('arrived'), false);
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
  it('waits 12s while the rider is still and 4s after a move', () => {
    const previous = { latitude: 28.61, longitude: 77.21, at: 1_000_000 };
    assert.equal(
      shouldSampleFix(previous, fix({ timestamp: 1_000_000 + 3_000 })),
      false,
    );
    assert.equal(
      shouldSampleFix(previous, fix({ timestamp: 1_000_000 + 12_000 })),
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
