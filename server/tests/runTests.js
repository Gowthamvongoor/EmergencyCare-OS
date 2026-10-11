const { runAllSystemTests } = require('../routes/tests');

console.log('🧪 Starting EmergencyCare OS Comprehensive Algorithm & Regression Tests...\n');

const results = runAllSystemTests();

console.log(`====================================================`);
console.log(`Test Suite: ${results.suite}`);
console.log(`Total: ${results.totalTests} | Passed: ${results.passed} | Failed: ${results.failed} (${results.passRate})`);
console.log(`Duration: ${results.durationMs}ms`);
console.log(`====================================================\n`);

results.tests.forEach((t, i) => {
  const symbol = t.status === 'PASSED' ? '✅' : '❌';
  console.log(`${symbol} [${t.id}] ${t.name} (${t.category})`);
  console.log(`   Expected: ${t.expected}`);
  console.log(`   Actual:   ${t.actual}`);
  if (t.error) console.log(`   Error:    ${t.error}`);
  console.log('');
});

if (results.failed > 0) {
  console.error(`💥 ${results.failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log(`🎉 All ${results.passed} OS algorithm tests passed successfully!`);
  process.exit(0);
}
