import type { NextApiRequest, NextApiResponse } from 'next';
import { readFeatures, writeFeatures } from '@/lib/server/featuresStore';

function assertAdmin(req: NextApiRequest) {
  const expected = process.env.ADMIN_API_TOKEN || '';
  const token = String(req.headers['x-admin-token'] || '');
  if (!expected || token !== expected) {
    const err: any = new Error('Unauthorized');
    (err.statusCode = 401);
    throw err;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      assertAdmin(req);
      const features = await readFeatures();
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(features);
    }
    if (req.method === 'POST') {
      assertAdmin(req);
      const body = req.body || {};
      const next = await writeFeatures(body);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(next);
    }
    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (e: any) {
    const code = e?.statusCode || 500;
    return res.status(code).json({ message: e?.message || 'Internal Server Error' });
  }
}
