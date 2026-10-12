import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

/** Parse `input` with a zod schema, converting failures into a 400. */
export function validate(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}

function toValidationError(zodError) {
  const details = zodError.issues.map((issue) => ({
    field: issue.path.join('.') || null,
    message: issue.message,
  }));
  return new HttpError(400, 'Validation failed', details);
}

// Express identifies error handlers by arity, so all four params are required.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) err = toValidationError(err);

  // Malformed JSON body from express.json()
  if (err.type === 'entity.parse.failed') {
    err = new HttpError(400, 'Request body is not valid JSON');
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { message: err.message, ...(err.details && { details: err.details }) },
    });
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
}
