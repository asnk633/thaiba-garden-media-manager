try {
  const pkg1 = require('@libsql/client');
  const pkg2 = require('libsql');
  console.log('@@ @libsql/client exports keys:', Object.keys(pkg1));
  console.log('@@ type of default export (if any):', typeof pkg1.default);
  console.log('@@ libsql exports keys:', Object.keys(pkg2));
  console.log('@@ libsql default type:', typeof pkg2.default);
  console.log('@@ full @libsql/client object (shallow):', Object.keys(pkg1).slice(0,20));
} catch (e) {
  console.error('inspect error:', e && e.stack ? e.stack : e);
  process.exitCode = 2;
}
