const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from the docs directory
app.use(express.static(path.join(__dirname, 'docs')));

// Serve the AI dashboard demo
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'ai-dashboard-demo.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open your browser to see the AI Dashboard UI`);
});