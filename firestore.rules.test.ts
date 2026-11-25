import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesText = fs.readFileSync(rulesPath, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

test('firestore.rules starts with default-deny safety net and rules_version 2', () => {
  assert.match(rulesText, /rules_version\s*=\s*'2';/);
  assert.match(rulesText, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
});

test('firestore.rules enforces email_verified == true for admin identity (anti-spoofing)', () => {
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesText, /pinky890114@gmail\.com/);
});

test('firestore.rules covers every collection declared in firebase-blueprint.json', () => {
  const paths = Object.keys(blueprint.firestore);
  assert.ok(paths.includes('/products/{productId}'));
  assert.ok(paths.includes('/swatches/{swatchId}'));
  assert.ok(paths.includes('/settings/{settingId}'));
  assert.ok(paths.includes('/admins/{userId}'));

  assert.match(rulesText, /match \/products\/\{productId\}/);
  assert.match(rulesText, /match \/swatches\/\{swatchId\}/);
  assert.match(rulesText, /match \/settings\/\{settingId\}/);
  assert.match(rulesText, /match \/admins\/\{userId\}/);
});

test('firestore.rules enforces strict schema blueprints, hasOnly, and server timestamps on writes', () => {
  assert.match(rulesText, /function isValidProduct\(data, productId\)/);
  assert.match(rulesText, /function isValidSwatch\(data, swatchId\)/);
  assert.match(
    rulesText,
    /data\.categoryId in \['featured', 'custom', 'crochet_bib', 'crochet_outfit'\]/
  );
  assert.match(
    rulesText,
    /data\.libraryType in \['fabric', 'rhinestone', 'eye_color', 'ribbon_color', 'yarn'\]/
  );
  assert.match(rulesText, /data\.sectionVisibility\.proxy is bool/);
  assert.match(rulesText, /data\.sectionVisibility\.crochet is bool/);
  assert.deepEqual(blueprint.entities.FabricSwatch.properties.libraryType.enum, [
    'fabric',
    'rhinestone',
    'eye_color',
    'ribbon_color',
    'yarn',
  ]);
  assert.deepEqual(blueprint.entities.Product.properties.categoryId.enum, [
    'featured',
    'custom',
    'crochet_bib',
    'crochet_outfit',
  ]);
  assert.match(rulesText, /function isValidStorefrontConfig\(data\)/);
  assert.match(rulesText, /function isValidAdminProfile\(data, userId\)/);
  assert.match(rulesText, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesText, /incoming\(\)\.updatedAt == request\.time/);
  assert.match(rulesText, /incoming\(\)\.createdAt == existing\(\)\.createdAt/);
  assert.match(rulesText, /affectedKeys\(\)\.hasOnly\(/);
});

test('firestore.rules enforces secure list queries without DB reads inside allow list', () => {
  const listLines = rulesText
    .split('\n')
    .filter((line) => line.trim().startsWith('allow list:'));
  assert.equal(listLines.length, 4);
  for (const line of listLines) {
    assert.ok(!line.includes('exists('), `allow list must not call exists(): ${line}`);
    assert.ok(!line.includes('get('), `allow list must not call get(): ${line}`);
    assert.ok(!line.includes('isAdmin()'), `allow list must use zero-read isPrimaryAdmin(): ${line}`);
  }
});
