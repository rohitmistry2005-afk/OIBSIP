import test from 'node:test';
import assert from 'node:assert/strict';
import { securityHeaders, globalRateLimiter, authRateLimiter } from '../../src/middleware/security.middleware.js';
test('security middleware exports',()=>{assert.equal(typeof securityHeaders,'function');assert.equal(typeof globalRateLimiter,'function');assert.equal(typeof authRateLimiter,'function');});
