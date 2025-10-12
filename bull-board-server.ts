import { Queue } from 'bullmq';
import express from 'express';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

const app = express();
const aiQueue = new Queue('ai-evaluation', { connection: { host: 'localhost', port: 6379 } });

const rubricsQueue = new Queue('rubrics-creation', { connection: { host: 'localhost', port: 6379 } });

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(aiQueue),new BullMQAdapter(rubricsQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

app.listen(3001, () => {
  console.log('Bull Board running on http://localhost:3001/admin/queues');
});
