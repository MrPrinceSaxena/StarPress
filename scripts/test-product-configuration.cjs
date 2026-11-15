const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node' } });
const { productConfigurationSchema, priceConfiguration } = require('../src/lib/product-configuration.ts');
const config = productConfigurationSchema.parse({ version: 1, revision: 1, quantity: { unit: 'pack', piecesPerUnit: 100, minimum: 1, maximum: 10, step: 1 }, unitPricePaise: 29900, options: [{ id: 'paper', label: 'Paper', required: true, choices: [{ id: 'premium', label: 'Premium', pricePaise: 1000 }] }], addOns: [{ id: 'design', label: 'Design', pricePaise: 50000, charge: 'per_order' }], fields: [], artwork: { mode: 'required', instructions: 'Upload print-ready artwork' } });
assert.deepEqual(priceConfiguration(config, 2, { paper: 'premium' }, ['design']), { totalPaise: 111800, quantity: 2, pieces: 200, revision: 1 });
for (const quantity of [0, 1.5, 11, NaN]) assert.throws(() => priceConfiguration(config, quantity, { paper: 'premium' }, []));
assert.throws(() => priceConfiguration(config, 1, {}, []));
assert.throws(() => priceConfiguration(config, 1, { paper: 'fake' }, []));
assert.throws(() => priceConfiguration(config, 1, { paper: 'premium', injected: 'x' }, []));
assert.throws(() => priceConfiguration(config, 1, { paper: 'premium' }, ['design', 'design']));
assert.throws(() => priceConfiguration(config, 1, { paper: 'premium' }, ['fake']));
assert.equal(productConfigurationSchema.safeParse({ ...config, options: [...config.options, ...config.options] }).success, false);
console.log('PASS: configuration pricing, quantity bounds, required options, unknown selections and duplicate identifiers');
const Module = require('node:module');
const path = require('node:path');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.join(process.cwd(), 'src', request.slice(2)) : request, ...args); };
global.prisma = {};
const { saveConfigurationDraft } = require('../src/server/product-configuration.ts');
async function testDrafts() {
  let row = null;
  let failAudit = false;
  const client = { $transaction: async callback => {
    const before = row;
    try { return await callback({
      $queryRaw: async () => [{ id: 'product' }],
      productConfigurationDraft: {
        findUnique: async () => row,
        upsert: async ({ create, update }) => (row = row ? { ...row, ...update } : create),
      },
      adminAuditLog: { create: async () => { if (failAudit) throw new Error('audit unavailable'); } },
    }); } catch (error) { row = before; throw error; }
  } };
  assert.equal((await saveConfigurationDraft('product', 0, config, 'admin@example.test', client)).revision, 1);
  await assert.rejects(saveConfigurationDraft('product', 0, config, 'admin@example.test', client), error => error.statusCode === 409);
  failAudit = true;
  await assert.rejects(saveConfigurationDraft('product', 1, config, 'admin@example.test', client), /audit unavailable/);
  assert.equal(row.revision, 1);
  console.log('PASS: draft revisions, stale-save rejection and audit rollback');
}
testDrafts().catch(error => { console.error(error); process.exitCode = 1; });
