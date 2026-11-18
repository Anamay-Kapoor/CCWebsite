import { api } from '../server/middleware.js';
import { checkLogin, setSessionCookie, noCache, SESSION_HOURS } from '../server/auth.js';

// 10 attempts per IP per 15 minutes (per instance), on top of the slowed-down failures.
export default api({ methods: ['POST'], limit: { name: 'login', max: 10, windowMs: 15 * 60e3 } }, async (req, res) => {
  noCache(res);
  const { username, password } = req.body;
  const session = await checkLogin(username, password);
  setSessionCookie(req, res, session.token);
  return res.status(200).json({ username: session.username, hours: SESSION_HOURS });
});
