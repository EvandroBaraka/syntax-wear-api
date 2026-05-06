/**
 * Arquivo principal da aplicação (Entry Point).
 * Este arquivo é responsável por configurar o servidor Fastify, 
 * registrar plugins de segurança e definir as rotas iniciais.
 */

// Importa o framework Fastify para criação do servidor
import Fastify from 'fastify';
// Carrega as variáveis de ambiente do arquivo .env para o process.env
import 'dotenv/config';
// Importa o plugin de CORS para permitir/restringir acessos externos
import cors from '@fastify/cors';
// Importa o plugin Helmet para aumentar a segurança da API através de headers HTTP
import helmet from '@fastify/helmet';
import productRoutes from './routes/products.routes';

// Define a porta do servidor, buscando das variáveis de ambiente ou usando 3000 como padrão
const PORT = parseInt(process.env.PORT ?? '3000')

// Instancia o Fastify e habilita o log para monitoramento de requisições
const fastify = Fastify({
  logger: true
})

// Registra o plugin de CORS permitindo qualquer origem e envio de credenciais
fastify.register(cors, {
    origin: true,
    credentials: true,
})

// Registra o plugin Helmet para segurança, desabilitando o CSP para simplificar o desenvolvimento inicial
fastify.register(helmet, {
    contentSecurityPolicy: false,
});

fastify.register(productRoutes, { prefix: '/products' });

// Define a rota principal (home) que retorna informações básicas da API
fastify.get('/', async (request, reply) => {
  return { 
    message: 'E-commerce Syntax Wear API',
    version: '1.0.0',
    status: 'running',
   }
})

// Define uma rota de 'health check' para verificar se a API está online e o timestamp atual
fastify.get('/health', async (request, reply) => {
    return {
        status: 'ok',
        timeStamp: new Date().toISOString(),
    }
})

// Tenta iniciar o servidor na porta definida
try {
  fastify.listen({ port: PORT })
} catch (err) {
  // Em caso de erro ao iniciar, registra o erro no log e encerra o processo
  fastify.log.error(err)
  process.exit(1)
}

// Exporta a instância do servidor para ser utilizada em outros arquivos (ex: testes)
export default fastify;
