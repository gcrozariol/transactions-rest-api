import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

/**
 *  Create transaction
 * @param {FastifyInstance} app FastifyInstance
 */
function createTransaction(app: FastifyInstance) {
  app.post('/', async (req, res) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const body = createTransactionBodySchema.parse(req.body)
    const { type, amount } = body

    let { sessionId } = req.cookies

    if (!sessionId) {
      sessionId = randomUUID()
      res.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      ...body,
      id: randomUUID(),
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return res.status(201).send()
  })
}

/**
 * Get a single transaction or a list of transactions
 * @param {FastifyInstance} app FastifyInstance
 */
function getTransactions(app: FastifyInstance) {
  app.get(
    '/:id?',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const { sessionId } = req.cookies

      const getTransactionParamsSchema = z.object({
        id: z.string().uuid().optional(),
      })

      const { id } = getTransactionParamsSchema.parse(req.params)

      let transactions = []

      if (id) {
        transactions = await knex('transactions')
          .where({ id, session_id: sessionId })
          .select()
      } else {
        transactions = await knex('transactions')
          .where('session_id', sessionId)
          .select()
      }

      return res.status(200).send({
        data: transactions,
        meta: { count: transactions.length },
      })
    },
  )
}

/**
 * Get transaction's summary
 * @param {FastifyInstance} app FastifyInstance
 */
function getSummary(app: FastifyInstance) {
  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (req, res) => {
      const { sessionId } = req.cookies

      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return { data: summary }
    },
  )
}

/**
 * Transaction routes
 * @param {FastifyInstance} app FastifyInstance
 */
export async function transactionRoutes(app: FastifyInstance) {
  createTransaction(app)
  getSummary(app)
  getTransactions(app)
}
