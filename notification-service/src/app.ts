import express from 'express';
import cors from 'cors';
import notificationRoutes from './routes/notification.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'notification-service' });
});


// Modern Documentation Route
app.get('/notifications', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification Service Documentation</title>
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

        /* Top Navigation */
        .top-nav {
            display: flex;
            align-items: center;
            padding: 0 24px;
            height: 56px;
            border-bottom: 1px solid #e2e8f0;
            font-weight: 500;
        }
        .nav-item {
            margin-right: 24px;
            display: flex;
            align-items: center;
            color: #64748b;
            cursor: pointer;
        }
        .nav-item.active {
            color: #0f172a;
            border-bottom: 2px solid #0f172a;
            height: 100%;
        }
        .nav-item svg { margin-right: 8px; width: 16px; height: 16px; }

        /* Layout */
        .container {
            display: flex;
            max-width: 1400px;
            margin: 0 auto;
            min-height: calc(100vh - 56px);
        }

        .main-content {
            flex: 1;
            padding: 48px 64px;
            max-width: 900px;
        }

        .right-sidebar {
            width: 250px;
            padding: 48px 24px;
            border-left: 1px solid #f1f5f9;
        }

        /* Typography & Headers */
        .breadcrumb {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 12px;
        }
        .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }
        h1 {
            font-size: 32px;
            font-weight: 600;
            margin: 0;
            letter-spacing: -0.02em;
        }
        .subtitle {
            color: #475569;
            font-size: 16px;
            margin-bottom: 48px;
        }
        
        .copy-btn {
            display: flex;
            align-items: center;
            padding: 6px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            background: white;
            color: #334155;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .copy-btn svg { margin-right: 6px; width: 14px; height: 14px; }

        /* Tables */
        h3 {
            font-size: 20px;
            font-weight: 600;
            margin: 32px 0 16px 0;
            padding-bottom: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 48px;
        }
        th {
            text-align: left;
            padding: 12px 16px;
            font-size: 12px;
            font-weight: 600;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
        }
        td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }
        
        .path-col {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 13px;
            color: #334155;
            background: #f8fafc;
            border-radius: 4px;
            padding: 2px 6px !important;
            display: inline-block;
            margin-top: 12px;
            border: 1px solid #e2e8f0;
        }
        .desc-col {
            color: #475569;
            font-size: 13px;
        }

        /* Badges */
        .badge {
            font-size: 11px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
        }
        .badge-get { background: #e0f2fe; color: #0284c7; }
        .badge-post { background: #dcfce7; color: #16a34a; }
        .badge-patch { background: #fef9c3; color: #ca8a04; }
        .badge-delete { background: #fee2e2; color: #dc2626; }

        /* Right Sidebar TOC */
        .toc-header {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
        }
        .toc-header svg { margin-right: 8px; width: 14px; height: 14px; }
        .right-sidebar a {
            display: block;
            color: #64748b;
            text-decoration: none;
            font-size: 13px;
            margin-bottom: 12px;
        }
        .right-sidebar a:hover { color: #0f172a; }
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
                <h1>Notification Service</h1>
                <button class="copy-btn">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    Copy page
                </button>
            </div>
            
            <div class="subtitle">A comprehensive list of all available endpoints for this microservice. For the complete NexusCart API specification, visit api.nexuscart.com.</div>

            
      <h3 id="system">System</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">Method</th>
            <th style="width: 35%;">Endpoint</th>
            <th style="width: 45%;">Description</th>
          </tr>
        </thead>
        <tbody>

          <tr>
            <td class="method-col">
              <span class="badge badge-get">GET</span>
            </td>
            <td class="path-col">/api/notifications/health</td>
            <td class="desc-col">Health check</td>
          </tr>
        </tbody>
      </table>
    

        </div>

        <div class="right-sidebar">
            <div class="toc-header">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                On this page
            </div>
            <a href="#system">System</a>

        </div>
    </div>
</body>
</html>
`);
});

export default app;
