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

app.post('/chatToDocument', async (c) => {
	const openai = new OpenAI({
		apiKey: c.env.OPEN_AI_KEY,
	});

	const { documentData, question } = await c.req.json();

	const chatCompletion = await openai.chat.completions.create({
		messages: [
			{
				role: 'system',
				content:
					'You are a assistant helping the user to chat to a document, I am providing a JSON file of the markdown for the document. Using this, answer the users question in the clearest way possible, the document is about ' +
					documentData,
			},
			{
				role: 'user',
				content: 'My Question is: ' + question,
			},
		],
		model: 'gpt-4o-mini',
		temperature: 0.5,
	});

	const response = chatCompletion.choices[0].message.content;

	return c.json({ message: response });
});

app.post('/translateDocument', async (c) => {
	const { documentData, targetLang } = await c.req.json();

	// Generate summary of the document
	const summaryResponse = await c.env.AI.run('@cf/facebook/bart-large-cnn', {
		input_text: documentData,
		max_length: 1000,
	});

	// Translate the summary into another language
	const response = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
		text: summaryResponse.summary,
		source_lang: 'english', // defaults to english
		target_lang: targetLang,
	});

	return new Response(JSON.stringify(response));
});

// SEE CHAT GPT EXPLANATION OF THE FOLLOWING CODE
// app.post('/chatToDocument', async (c) => {
// 	const openai = new OpenAI({ apiKey: c.env.OPEN_AI_KEY });
// 	// console.log(c.env.OPEN_AI_KEY);
// 	const { documentData, question } = await c.req.json();

// 	const chatCompletion = await openai.chat.completions.create({
// 		messages: [
// 			{
// 				role: 'system',
// 				content:
// 					'You are an assistant helping the user to chat to a document, I am providing a JSON file of the markdown for the document. Using this, answer the users question in the clearest way possible, the document is about ' +
// 					documentData,
// 			},
// 			{ role: 'user', content: 'My question is: ' + question },
// 		],
// 		model: 'gpt-3.5-turbo',
// 		temperature: 0.5,
// 	});
// 	const response = chatCompletion.choices[0].message.content;

// 	return c.json({ message: response });
// });

export default app;
