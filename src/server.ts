import { buildApp } from "./app";

const PORT = parseInt(process.env.PORT ?? "3000");
const HOST = process.env.HOST ?? "0.0.0.0";

const startServer = async () => {
	const app = await buildApp();

	try {
		await app.listen({ host: HOST, port: PORT });
		console.log(`🚀 Server running at http://${HOST}:${PORT}`);
		console.log(`📚 API Docs at http://${HOST}:${PORT}/api-docs`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

startServer();
