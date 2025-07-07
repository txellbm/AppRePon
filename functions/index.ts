import { onRequest } from 'firebase-functions/v2/https';

export const disabledInitJson = onRequest((req, res) => {
  res.status(404).json({ error: 'init.json disabled' });
});
