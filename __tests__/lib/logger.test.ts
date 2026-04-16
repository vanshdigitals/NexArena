/**
 * @jest-environment node
 *
 * Tests for lib/logger.ts — structured logging utility.
 */

import { createLogger, logger } from '@/lib/logger';
import type { LogLevel } from '@/lib/logger';

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createLogger returns an object with all log level methods', () => {
    const log = createLogger('test');
    expect(typeof log.debug).toBe('function');
    expect(typeof log.info).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.error).toBe('function');
  });

  it('default logger instance is available', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('logger.info does not throw', () => {
    expect(() => logger.info('test message')).not.toThrow();
  });

  it('logger.error does not throw', () => {
    expect(() => logger.error('error message', { code: '500' })).not.toThrow();
  });

  it('logger.warn does not throw', () => {
    expect(() => logger.warn('warning message')).not.toThrow();
  });

  it('logger.debug does not throw', () => {
    expect(() => logger.debug('debug message')).not.toThrow();
  });

  it('contextualised logger includes context in output', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const log = createLogger('/api/test');
    log.info('hello');
    // In development mode, it should call console.log
    expect(spy).toHaveBeenCalled();
    const callArg = spy.mock.calls[0][0] as string;
    expect(callArg).toContain('/api/test');
    expect(callArg).toContain('hello');
    spy.mockRestore();
  });

  it('error level uses console.error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    const log = createLogger('test');
    log.error('failure');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('warn level uses console.warn', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    const log = createLogger('test');
    log.warn('careful');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('accepts optional data parameter', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const log = createLogger('test');
    log.info('with data', { key: 'value', count: 42 });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('createLogger without context still works', () => {
    const log = createLogger();
    const spy = jest.spyOn(console, 'log').mockImplementation();
    log.info('no context');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('all log levels are valid strings', () => {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    expect(levels).toHaveLength(4);
    levels.forEach(l => expect(typeof l).toBe('string'));
  });
});
