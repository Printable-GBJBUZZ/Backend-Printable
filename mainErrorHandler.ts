import { Request, Response, NextFunction } from 'express';

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error Stack:', err.stack);
  console.log('Request Path:', req.path);
  console.log('Raw Request Body:', req.body);
  console.log('Request Headers:', req.headers);

  const status = err.status || 400;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    status: 'error',
    statusCode: status,
    message: message
  });
}

export default errorHandler;