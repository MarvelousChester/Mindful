import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: express.Application = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
  });
}

export default app;
