import fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import { transactionRoutes } from './routes/transactions'

export const app = fastify()

app.register(fastifyCookie)
app.register(transactionRoutes, { prefix: 'transactions' })
