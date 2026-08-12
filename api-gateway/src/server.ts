import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();

app.use(cors());

// Microservice Routes
app.use('/api/auth', createProxyMiddleware({ target: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:5001', changeOrigin: true, pathRewrite: { '^/api/auth': '/auth' } }) as express.RequestHandler);
app.use('/api/business', createProxyMiddleware({ target: process.env.BUSINESS_SERVICE_URL || 'http://127.0.0.1:5002', changeOrigin: true, pathRewrite: { '^/api/business': '/business' } }) as express.RequestHandler);
app.use('/api/products', createProxyMiddleware({ target: process.env.PRODUCT_SERVICE_URL || 'http://127.0.0.1:5003', changeOrigin: true, pathRewrite: { '^/api/products': '/products' } }) as express.RequestHandler);
app.use('/api/admin', createProxyMiddleware({ target: process.env.ADMIN_SERVICE_URL || 'http://127.0.0.1:5004', changeOrigin: true, pathRewrite: { '^/api/admin': '/admin' } }) as express.RequestHandler);
app.use('/api/orders', createProxyMiddleware({ target: process.env.ORDER_SERVICE_URL || 'http://127.0.0.1:5005', changeOrigin: true, pathRewrite: { '^/api/orders': '/orders' } }) as express.RequestHandler);
app.use('/api/payments', createProxyMiddleware({ target: process.env.PAYMENT_SERVICE_URL || 'http://127.0.0.1:5006', changeOrigin: true, pathRewrite: { '^/api/payments': '/payments' } }) as express.RequestHandler);
app.use('/api/notifications', createProxyMiddleware({ target: process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:5007', changeOrigin: true, pathRewrite: { '^/api/notifications': '/notifications' } }) as express.RequestHandler);
app.use('/api/reviews', createProxyMiddleware({ target: process.env.REVIEW_SERVICE_URL || 'http://127.0.0.1:5008', changeOrigin: true, pathRewrite: { '^/api/reviews': '/reviews' } }) as express.RequestHandler);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API Gateway is running' });
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexusCart Developer Hub</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body, html {
            margin: 0; padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            background-color: #ffffff;
            font-size: 14px;
            line-height: 1.5;
        }

        .top-nav { display: flex; align-items: center; padding: 0 24px; height: 56px; border-bottom: 1px solid #e2e8f0; font-weight: 500; }
        .nav-item { margin-right: 24px; display: flex; align-items: center; color: #64748b; cursor: pointer; }
        .nav-item.active { color: #0f172a; border-bottom: 2px solid #0f172a; height: 100%; }
        .nav-item svg { margin-right: 8px; width: 16px; height: 16px; }
        .container { display: flex; max-width: 1400px; margin: 0 auto; min-height: calc(100vh - 56px); }
        .main-content { flex: 1; padding: 48px 64px; max-width: 900px; }
        .right-sidebar { width: 250px; padding: 48px 24px; border-left: 1px solid #f1f5f9; }
        .breadcrumb { font-size: 12px; color: #64748b; margin-bottom: 12px; }
        .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        h1 { font-size: 32px; font-weight: 600; margin: 0; letter-spacing: -0.02em; }
        .subtitle { color: #475569; font-size: 16px; margin-bottom: 48px; }
        .copy-btn { display: flex; align-items: center; padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; color: #334155; font-size: 13px; font-weight: 500; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .copy-btn svg { margin-right: 6px; width: 14px; height: 14px; }
        h3 { font-size: 20px; font-weight: 600; margin: 32px 0 16px 0; padding-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 48px; }
        th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0; }
        td { padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        
        .path-col { font-size: 13px; color: #334155; }
        .desc-col { color: #475569; font-size: 13px; }
        .toc-header { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; display: flex; align-items: center; }
        .toc-header svg { margin-right: 8px; width: 14px; height: 14px; }
        .right-sidebar a { display: block; color: #64748b; text-decoration: none; font-size: 13px; margin-bottom: 12px; }
        .right-sidebar a:hover { color: #0f172a; }

        a.service-link { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #2563eb; text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; background: #eff6ff; border-radius: 4px; padding: 4px 8px; border: 1px solid #bfdbfe; transition: all 0.2s; }
        a.service-link:hover { text-decoration: none; background: #dbeafe; color: #1d4ed8; }
        a.service-link svg { width: 14px; height: 14px; margin-left: 6px; }
    </style>
</head>
<body>
    <div class="top-nav">
        <div class="nav-item active">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            Documentation
        </div>
        
    </div>

    <div class="container">
        <div class="main-content">
            <div class="breadcrumb">Get Started</div>
            
            <div class="header-row">
                <h1>NexusCart Developer Hub</h1>
                <button class="copy-btn">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    Copy page
                </button>
            </div>
            
            <div class="subtitle">Welcome to the central API Gateway. Below is a comprehensive list of all microservices available in the cluster. Click on any service link to view its full API documentation.</div>

            <h3 id="core-services">Core Services</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 25%;">Service</th>
                        <th style="width: 35%;">Gateway Route</th>
                        <th style="width: 40%;">Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="desc-col" style="font-weight: 500; color: #0f172a;">Authentication</td>
                        <td class="path-col">
                            <a href="/api/auth" class="service-link">/api/auth <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>
                        </td>
                        <td class="desc-col">User authentication, registration, and JWT token issuance.</td>
                    </tr>
                    <tr>
                        <td class="desc-col" style="font-weight: 500; color: #0f172a;">Business & Vendors</td>
                        <td class="path-col">
                            <a href="/api/business" class="service-link">/api/business <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>
                        </td>
                        <td class="desc-col">Vendor registrations, business profile management.</td>
                    </tr>
                    <tr>
                        <td class="desc-col" style="font-weight: 500; color: #0f172a;">Product Catalog</td>
                        <td class="path-col">
                            <a href="/api/products" class="service-link">/api/products <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>
                        </td>
                        <td class="desc-col">Product listings, inventory, and catalog search.</td>
                    </tr>
                    <tr>
                        <td class="desc-col" style="font-weight: 500; color: #0f172a;">Administration</td>
                        <td class="path-col">
                            <a href="/api/admin" class="service-link">/api/admin <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>
                        </td>
                        <td class="desc-col">Admin dashboard routes, business approvals, and metrics.</td>
                    </tr>
                </tbody>
            </table>

            <h3 id="infrastructure">Infrastructure</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 25%;">Service</th>
                        <th style="width: 35%;">Gateway Route</th>
                        <th style="width: 40%;">Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="desc-col" style="font-weight: 500; color: #0f172a;">Order Management</td>
                        <td class="path-col">
                            <a href="/api/orders" class="service-link">/api/orders <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>
                        </td>
                        <td class="desc-col">Order placement, tracking, and fulfillment workflows.</td>
                    </tr>
                    <tr>
                        <td class="desc-col" style="font-weight: 500; color: #0f172a;">Payment Gateway</td>
                        <td class="path-col">
                            <a href="/api/payments" class="service-link">/api/payments <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>
                        </td>
                        <td class="desc-col">Payment processing, invoices, and transaction history.</td>
                    </tr>
                    <tr>
                        <td class="desc-col" style="font-weight: 500; color: #0f172a;">Notifications</td>
                        <td class="path-col">
                            <a href="/api/notifications" class="service-link">/api/notifications <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>
                        </td>
                        <td class="desc-col">Email, SMS, and push notification dispatcher.</td>
                    </tr>
                    <tr>
                        <td class="desc-col" style="font-weight: 500; color: #0f172a;">Reviews & Ratings</td>
                        <td class="path-col">
                            <a href="/api/reviews" class="service-link">/api/reviews <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>
                        </td>
                        <td class="desc-col">Product reviews, vendor ratings, and feedback moderation.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="right-sidebar">
            <div class="toc-header">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                On this page
            </div>
            <a href="#core-services">Core Services</a>
            <a href="#infrastructure">Infrastructure</a>
        </div>
    </div>
</body>
</html>
  `);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
