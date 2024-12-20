import OpenAI from 'openai';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
	OPEN_AI_KEY: string;
	AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
	'/*', // '/*' means that the following rules apply to all the routes we have in this app
	cors({
		origin: '*', // Allow requests from your Nextjs app
		allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests', 'Content-Type'], // Add Content-Type to the allowed headers to fix CORS
		allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT'],
		maxAge: 600,
		credentials: true,
	})
);

app.post('/translateDocument', async (c) => {
	const { documentData, targetlang } = await c.req.json();

	// Generate summary of the document
	const summaryResponse = await c.env.AI.run('@cf/facebook/bart-large-cnn', {
		input_text: documentData,
		max_length: 1000,
	});

	// Translate the summary into another language
	const response = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
		text: summaryResponse.summary,
		source_lang: 'english', // defaults to english
		target_lang: targetlang,
	});

	return new Response(JSON.stringify(response));
});

export default app;
