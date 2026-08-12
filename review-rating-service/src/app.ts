import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'review-rating-service' });
});


// Modern Documentation Route
app.get('/reviews', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Review & Rating Service - API Documentation</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0f172a;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent-1: #3b82f6;
            --accent-2: #8b5cf6;
            --glass-bg: rgba(30, 41, 59, 0.7);
            --glass-border: rgba(255, 255, 255, 0.1);
        }

        body, html {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-x: hidden;
        }

        /* Animated Background Blob */
        .bg-blob {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80vw;
            height: 80vw;
            max-width: 800px;
            max-height: 800px;
            background: radial-gradient(circle, var(--accent-2) 0%, var(--accent-1) 100%);
            filter: blur(120px);
            opacity: 0.15;
            z-index: -1;
            animation: pulse 10s ease-in-out infinite alternate;
        }

        @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
            100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.25; }
        }

        nav {
            width: 100%;
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-sizing: border-box;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--glass-border);
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .logo {
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 24px;
            background: linear-gradient(135deg, #fff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 1px;
        }

        main {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            width: 100%;
            max-width: 1000px;
            box-sizing: border-box;
            animation: slideUp 0.8s ease-out forwards;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .header-title {
            font-family: 'Outfit', sans-serif;
            font-size: clamp(40px, 6vw, 72px);
            font-weight: 800;
            text-align: center;
            line-height: 1.1;
            margin-bottom: 20px;
            background: linear-gradient(to right, #60a5fa, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .header-subtitle {
            font-size: 18px;
            color: var(--text-muted);
            text-align: center;
            max-width: 600px;
            margin-bottom: 50px;
            line-height: 1.6;
        }

        .glass-card {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 24px;
            padding: 40px;
            width: 100%;
            backdrop-filter: blur(16px);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .glass-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .api-endpoint {
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 20px;
            border: 1px solid rgba(255,255,255,0.05);
            transition: background 0.2s ease;
        }

        .api-endpoint:hover {
            background: rgba(0, 0, 0, 0.5);
        }

        .method {
            font-family: monospace;
            font-weight: bold;
            font-size: 14px;
            padding: 6px 12px;
            border-radius: 6px;
            margin-right: 16px;
            letter-spacing: 1px;
        }

        .method.get { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
        .method.post { background: rgba(16, 185, 129, 0.2); color: #34d399; }

        .path {
            font-family: monospace;
            font-size: 16px;
            color: #e2e8f0;
            flex: 1;
        }

        .description {
            color: var(--text-muted);
            font-size: 14px;
            margin-left: 20px;
        }

        .btn {
            display: inline-block;
            background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
            color: white;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 30px;
            font-weight: 600;
            font-family: 'Outfit', sans-serif;
            margin-top: 30px;
            transition: opacity 0.2s ease, transform 0.2s ease;
            border: none;
            cursor: pointer;
            box-shadow: 0 10px 20px -10px rgba(139, 92, 246, 0.5);
        }

        .btn:hover {
            opacity: 0.9;
            transform: scale(1.05);
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 40px;
            width: 100%;
        }

        .feature-item {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 24px;
            border-radius: 16px;
            text-align: center;
        }

        .feature-item h3 {
            font-family: 'Outfit', sans-serif;
            color: #e2e8f0;
            margin: 0 0 10px 0;
            font-size: 18px;
        }

        .feature-item p {
            color: var(--text-muted);
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="bg-blob"></div>
    
    <nav>
        <div class="logo">NEXUSCART</div>
        <div style="color: var(--text-muted); font-size: 14px;">API v1.0</div>
    </nav>

    <main>
        <h1 class="header-title">Review & Rating Service</h1>
        <p class="header-subtitle">Welcome to the interactive documentation for the NexusCart Review & Rating Service. Explore available endpoints and integrate seamlessly with our modern infrastructure.</p>
        
        <div class="glass-card">
            <h2 style="font-family: 'Outfit'; margin-top: 0; margin-bottom: 24px; color: white;">Available Endpoints</h2>
            
            <div class="api-endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/reviews</span>
                <span class="description">Access the Review & Rating Service documentation</span>
            </div>
            
            <div class="api-endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/reviews/health</span>
                <span class="description">Check service health status</span>
            </div>

            <!-- Future endpoints will appear here -->
        </div>

        <div class="features">
            <div class="feature-item">
                <h3>⚡ Real-time Ready</h3>
                <p>Built on event-driven architecture for instant state updates.</p>
            </div>
            <div class="feature-item">
                <h3>🔒 Secure</h3>
                <p>Fully authenticated microservice boundary with zero-trust principles.</p>
            </div>
            <div class="feature-item">
                <h3>🚀 Scalable</h3>
                <p>Dockerized and ready for horizontal scaling in Kubernetes.</p>
            </div>
        </div>

        <a href="/api/health" class="btn">View Gateway Status</a>
    </main>
</body>
</html>
`);
});

export default app;
