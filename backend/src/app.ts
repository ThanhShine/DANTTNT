import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';

// Routes
import authRoutes      from './routes/auth.routes';
import userRoutes      from './routes/user.routes';
import accountRoutes   from './routes/account.routes';
import categoryRoutes  from './routes/category.routes';
import productRoutes   from './routes/product.routes';
import cartRoutes      from './routes/cart.routes';
import orderRoutes     from './routes/order.routes';
import reviewRoutes    from './routes/review.routes';
import behaviorRoutes  from './routes/behavior.routes';
import adminRoutes     from './routes/admin.routes';
import aiRoutes        from './routes/ai.routes';
import chatRoutes      from './routes/chat.routes';
import visionRoutes    from './routes/vision.routes';
import userMemoryRoutes from './routes/userMemory.routes';
import paymentRoutes    from './routes/payment.routes';
import couponRoutes     from './routes/coupon.routes';
import returnRoutes     from './routes/return.routes';


// Middleware
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app: Application = express();

// ── Security ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      config.cors.origin,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.env === 'development' ? 100000 : config.rateLimit.max,
  message:  { success: false, message: 'Quá nhiều request, vui lòng thử lại sau' },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: () => config.env === 'development', // Bỏ qua rate limit khi đang phát triển
});
app.use(limiter);

// ── Body Parser ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──────────────────────────────────────────────────
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// ── Static Files ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), config.upload.dir)));

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Sales AI Backend is running 🚀',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// ── API Routes ───────────────────────────────────────────────
const API_PREFIX = '/api';

app.use(`${API_PREFIX}/auth`,       authRoutes);
app.use(`${API_PREFIX}/users`,      userRoutes);
app.use(`${API_PREFIX}/account`,    accountRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/products`,   productRoutes);
app.use(`${API_PREFIX}/cart`,       cartRoutes);
app.use(`${API_PREFIX}/orders`,     orderRoutes);
app.use(`${API_PREFIX}/reviews`,    reviewRoutes);
app.use(`${API_PREFIX}/behaviors`,  behaviorRoutes);
app.use(`${API_PREFIX}/admin`,      adminRoutes);
app.use(`${API_PREFIX}/ai`,         aiRoutes);
app.use(`${API_PREFIX}/chat`,       chatRoutes);
app.use(`${API_PREFIX}/vision`,     visionRoutes);
app.use(`${API_PREFIX}/user`,       userMemoryRoutes);
app.use(`${API_PREFIX}/payment`,    paymentRoutes);
app.use(`${API_PREFIX}/coupons`,    couponRoutes);
app.use(`${API_PREFIX}/returns`,    returnRoutes);


// ── 404 & Error Handlers ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
