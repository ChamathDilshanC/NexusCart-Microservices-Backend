import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();

app.use(cors());

// Microservice Routes
app.use('/api/auth', createProxyMiddleware({ target: 'http://127.0.0.1:5001', changeOrigin: true, pathRewrite: { '^/api/auth': '/auth' } }) as express.RequestHandler);
app.use('/api/business', createProxyMiddleware({ target: 'http://127.0.0.1:5002', changeOrigin: true, pathRewrite: { '^/api/business': '/business' } }) as express.RequestHandler);
app.use('/api/products', createProxyMiddleware({ target: 'http://127.0.0.1:5003', changeOrigin: true, pathRewrite: { '^/api/products': '/products' } }) as express.RequestHandler);
app.use('/api/admin', createProxyMiddleware({ target: 'http://127.0.0.1:5004', changeOrigin: true, pathRewrite: { '^/api/admin': '/admin' } }) as express.RequestHandler);
app.use('/api/orders', createProxyMiddleware({ target: 'http://127.0.0.1:5005', changeOrigin: true, pathRewrite: { '^/api/orders': '/orders' } }) as express.RequestHandler);
app.use('/api/payments', createProxyMiddleware({ target: 'http://127.0.0.1:5006', changeOrigin: true, pathRewrite: { '^/api/payments': '/payments' } }) as express.RequestHandler);
app.use('/api/notifications', createProxyMiddleware({ target: 'http://127.0.0.1:5007', changeOrigin: true, pathRewrite: { '^/api/notifications': '/notifications' } }) as express.RequestHandler);
app.use('/api/reviews', createProxyMiddleware({ target: 'http://127.0.0.1:5008', changeOrigin: true, pathRewrite: { '^/api/reviews': '/reviews' } }) as express.RequestHandler);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API Gateway is running' });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    name: 'NexusCart API Gateway',
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/business', '/api/products', '/api/admin', '/api/orders', '/api/payments', '/api/notifications', '/api/reviews']
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
