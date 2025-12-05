let handler;

try {
  const mainModule = require('../dist/main');
  handler = mainModule.default || mainModule;
} catch (error) {
  console.error('Failed to load main module:', error);
  handler = async (req, res) => {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to initialize application',
      details: error.message,
    });
  };
}

module.exports = handler;
