// Import the framework and instantiate it
import Fastify from 'fastify';
import 'dotenv/config';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

const PORT = parseInt(process.env.PORT ?? '3000')

const fastify = Fastify({
  logger: true
})

fastify.register(cors, {
    origin: true,
    credentials: true,
})

fastify.register(helmet, {
    contentSecurityPolicy: false,
});

// Declare a route
fastify.get('/', async (request, reply) => {
  return { 
    message: 'E-commerce Syntax Wear API',
    version: '1.0.0',
    status: 'running',
   }
})

fastify.get('/health', async (request, reply) => {
    return {
        status: 'ok',
        timeStamp: new Date().toISOString(),
    }
})

// Run the server!
try {
  fastify.listen({ port: PORT })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

export default fastify;