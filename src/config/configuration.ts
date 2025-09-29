export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  env: process.env.NODE_ENV || 'development',
  redis: {
    url: process.env.REDIS_URL ?? 'redis://redis:6379',
  },
});
