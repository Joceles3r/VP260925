// Jest setup file pour configuration globale des tests

// Mock console pour tests plus propres (optionnel)
global.console = {
  ...console,
  // Supprimer les logs dans les tests sauf si explicitement demandé
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Garder warn et error pour debugging
  warn: console.warn,
  error: console.error,
};

// Variables d'environnement pour tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.VISUAL_PLAY_TOKEN_SECRET = 'test-secret';
process.env.AUDIT_HMAC_KEY = 'test-hmac-key';

// Timeout global pour tests async
jest.setTimeout(10000);

// Mock des fetch API pour tests
global.fetch = jest.fn();

// Helper functions pour tests
global.mockFetch = (responseData, status = 200) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => responseData,
    text: async () => JSON.stringify(responseData),
  });
};

global.mockFetchError = (error = 'Network error') => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(error));
};
