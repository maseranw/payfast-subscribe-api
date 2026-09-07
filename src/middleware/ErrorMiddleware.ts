import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[Error] ${req.method} ${req.url}: ${error.message}`);

  const isNotFound = /not found/i.test(error.message);
  const statusCode = isNotFound ? 404 : 500;
  const clientMessage = isNotFound ? 'Resource not found' : 'Internal server error';

  res.status(statusCode).json({
    error: clientMessage,
    timestamp: new Date().toISOString(),
  });
}