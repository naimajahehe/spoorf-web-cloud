import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ReleaseService } from '../src/services/releaseService';

describe('ReleaseService Suite (Desktop Installer Availability)', () => {
  test('1. without a configured installer URL the release is not downloadable', () => {
    const { available, release } = new ReleaseService(undefined).getLatestRelease();
    assert.equal(available, false);
    assert.equal(release.downloadUrl, null);
  });

  test('2. a configured installer URL is advertised as available', () => {
    const url = 'https://downloads.example.com/Spoorf%20Sentinel%20Setup.exe';
    const { available, release } = new ReleaseService(url).getLatestRelease();
    assert.equal(available, true);
    assert.equal(release.downloadUrl, url);
  });
});
