const path = require('path');

// Add backend/node_modules to module resolution paths so dependencies are resolved
const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
module.paths.unshift(backendNodeModules);
require('module').globalPaths.unshift(backendNodeModules);

// Load environment variables from backend/.env if available
try {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.join(__dirname, 'backend', '.env') });
  dotenv.config();
} catch (e) {
  // If dotenv not yet loaded, continue
}

// Forward to backend server
require('./backend/server.js');
