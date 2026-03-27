'use strict';
const common = require('../common');

// This test verifies that fs.realpathSync and fs.realpath correctly handle
// Windows extended-length path prefixes (\\?\C:\... and \\?\UNC\...).
// See: https://github.com/nodejs/node/issues/62446

if (!common.isWindows)
  common.skip('Windows-specific test.');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const tmpdir = require('../common/tmpdir');

tmpdir.refresh();

const testFile = tmpdir.resolve('extended-path-test.js');
fs.writeFileSync(testFile, 'module.exports = 42;');

// Construct the extended-length path for the test file.
// The \\?\ prefix is a Win32 API mechanism to bypass MAX_PATH limits.
const extendedPath = `\\\\?\\${testFile}`;

// fs.realpathSync should handle the \\?\ prefix and return a standard path.
{
  const result = fs.realpathSync(extendedPath);
  // The result should be the resolved path without the \\?\ prefix.
  assert.strictEqual(result.toLowerCase(), testFile.toLowerCase());
}

// fs.realpath (async) should also handle the \\?\ prefix.
fs.realpath(extendedPath, common.mustSucceed((result) => {
  assert.strictEqual(result.toLowerCase(), testFile.toLowerCase());
}));

// Also test that the extended path for the drive root works.
{
  const driveRoot = path.parse(testFile).root; // e.g., 'C:\'
  const extendedRoot = `\\\\?\\${driveRoot}`;
  const result = fs.realpathSync(extendedRoot);
  assert.strictEqual(result.toLowerCase(), driveRoot.toLowerCase());
}

// Test extended-length path with subdirectory.
const subDir = tmpdir.resolve('sub', 'dir');
fs.mkdirSync(subDir, { recursive: true });
const subFile = path.join(subDir, 'file.txt');
fs.writeFileSync(subFile, 'hello');

{
  const extendedSubFile = `\\\\?\\${subFile}`;
  const result = fs.realpathSync(extendedSubFile);
  assert.strictEqual(result.toLowerCase(), subFile.toLowerCase());
}
