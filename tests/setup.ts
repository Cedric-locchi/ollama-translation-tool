import { vi } from 'vitest';

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
};

// Mock process.exit
vi.mock('process', () => ({
    env: {},
    exit: vi.fn(),
}));
