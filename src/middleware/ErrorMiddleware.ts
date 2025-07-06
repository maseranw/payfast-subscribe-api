import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[Error] ${req.method} ${req.url}: ${error.message}`);
  
  res.status(500).json({
    error: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
}