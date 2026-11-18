import { api } from '../server/middleware.js';
import { clearSessionCookie, noCache } from '../server/auth.js';

export default api({ methods: ['POST'] }, async (req, res) => {
  noCache(res);
  clearSessionCookie(req, res);
  return res.status(200).json({ ok: true });
});
