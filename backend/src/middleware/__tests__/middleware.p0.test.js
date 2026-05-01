const { body } = require('express-validator');

const { buildRateLimiter } = require('../rateLimiter');
const { validateRequest } = require('../validateRequest');
const { errorHandler } = require('../errorHandler');

jest.mock('../../models/User', () => ({
  findById: jest.fn(),
}));

const User = require('../../models/User');
const { checkSubscription } = require('../checkSubscription');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };
}

describe('middleware P0 hardening', () => {
  test('buildRateLimiter blocks requests over max and sets Retry-After', () => {
    const limiter = buildRateLimiter({ windowMs: 60_000, max: 2 });
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.set).toHaveBeenCalledWith('Retry-After', expect.any(String));
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: 'RATE_LIMITED',
      })
    );
  });

  test('validateRequest returns standardized validation payload', async () => {
    const req = { body: { email: 'not-an-email' } };
    const res = createRes();
    const next = jest.fn();

    await body('email').isEmail().run(req);
    validateRequest(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
          }),
        ]),
      })
    );
  });

  test('checkSubscription returns UNAUTHORIZED when req.user is missing', async () => {
    const req = {};
    const res = createRes();
    const next = jest.fn();

    await checkSubscription(req, res, next);

    expect(User.findById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: 'UNAUTHORIZED',
      })
    );
  });

  test('errorHandler preserves standardized details payload', () => {
    const req = {};
    const res = createRes();
    const next = jest.fn();
    const err = {
      statusCode: 422,
      message: 'Semantic validation failed',
      code: 'VALIDATION_ERROR',
      details: [{ field: 'topic', message: 'Too long' }],
    };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: 'VALIDATION_ERROR',
        details: [{ field: 'topic', message: 'Too long' }],
      })
    );
  });
});
