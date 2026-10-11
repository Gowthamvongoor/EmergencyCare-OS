const db = require('../data/db');

console.log('🔄 Seeding EmergencyCare OS Database with initial demo state...');
db.resetDB();
console.log('✅ Database successfully initialized with:');
const store = db.getStore();
console.log(`- ${store.users.length} User Accounts (Admin, Doctor, Nurse, Coordinator)`);
console.log(`- ${store.patients.length} Fictional Patients`);
console.log(`- ${store.doctors.length} Doctors`);
console.log(`- ${store.nurses.length} Nurses`);
console.log(`- ${store.beds.length} Beds (ICU + General)`);
console.log(`- ${store.ambulances.length} Ambulances`);
console.log(`- ${store.operationTheatres.length} Operation Theatres`);
console.log(`- ${store.ventilators.length} Ventilators`);
console.log(`- ${store.systemLogs.length} Initial OS System Logs`);
console.log(`- ${store.auditLogs.length} Audit Log entries`);
console.log('🏁 Ready to run!');
