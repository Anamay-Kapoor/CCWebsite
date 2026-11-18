import { api } from '../server/middleware.js';
import { noCache } from '../server/auth.js';

export default api({ methods: ['GET'], auth: ['GET'] }, async (req, res) => {
  noCache(res);
  return res.status(200).json({ username: req.admin.username });
});
