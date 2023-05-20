import { app } from './app'
import { env } from './env'

app
  .listen({ port: env.DATABASE_PORT })
  .then(() =>
    console.log(`🚀 HTTP server running on port ${env.DATABASE_PORT}`),
  )
  .catch((e) => console.log(e))
