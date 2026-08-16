import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Deprecated service — kept as health-check shell for CI/CD compatibility
app.use('/business', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Business service is deprecated. All business/vendor functionality has been removed.',
    service: 'business-service (deprecated)'
  });
});

export default app;
