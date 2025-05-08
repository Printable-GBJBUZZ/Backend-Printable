function errorHandler(err:any, req:any, res:any, next:any) {
    console.error(err.stack);
  
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
  
    res.status(status).json({
      status: 'error',
      statusCode: status,
      message: message
    });
  }
  
export default errorHandler;
  