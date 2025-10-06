import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions, sessionTokenCookieName } from '@/lib/nextAuth';
import { prisma } from '@/lib/prisma';
import { getCookie } from 'cookies-next';
import env from '@/lib/env';
import { deleteSession } from 'models/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authOptions = getAuthOptions(req, res);
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (env.nextAuth.sessionStrategy === 'database') {
      const sessionToken = await getCookie(sessionTokenCookieName, {
        req,
        res,
      });
      const sessionDBEntry = await prisma.session.findFirst({
        where: {
          sessionToken: sessionToken,
        },
      });

      if (sessionDBEntry) {
        await deleteSession({
          where: {
            sessionToken: sessionToken,
          },
        });
      }
    }

    // Clear the session cookie(s). In production we may use a secure prefixed cookie
    // name (e.g. __Secure-next-auth.session-token). Use the configured cookie name
    // from `lib/nextAuth.ts` so we clear the exact cookie set during login.
    const cookieNamesToClear = [sessionTokenCookieName, 'next-auth.session-token'];

    const expires = 'Thu, 01 Jan 1970 00:00:01 GMT';
    const secureFlag = env.appUrl.startsWith('https://') ? '; Secure' : '';

    // Build multiple Set-Cookie headers to clear each cookie name for compatibility.
    const setCookieHeaders = cookieNamesToClear.map((name) =>
      `${name}=; Path=/; Expires=${expires}; HttpOnly; SameSite=Lax${secureFlag}`
    );

    // Set all clear-cookie headers
    res.setHeader('Set-Cookie', setCookieHeaders);

    // Also include a Location header and return the login URL to make client redirects
    // easier for callers. Client-side hooks can read the json.url and navigate.
    const redirectUrl = '/auth/login';
    res.setHeader('Location', redirectUrl);

    return res.status(200).json({ success: true, url: redirectUrl });
  } catch (error) {
    console.error('Signout error:', error);
    return res.status(500).json({ error: 'Failed to sign out' });
  }
}
