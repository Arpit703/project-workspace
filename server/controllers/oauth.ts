import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_workspace_token_key_1337';

const getBaseUrl = (req: Request): string => {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  // Dynamic fallback for protocol behind insecure proxies
  const isHttps = req.headers['x-forwarded-proto'] === 'https' || req.secure;
  return `${isHttps ? 'https' : 'http'}://${host}`;
};

// 1. Google OAuth Endpoints
export function getGoogleAuthUrl(req: Request, res: Response): void {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      res.status(400).json({
        error: 'GOOGLE_CLIENT_ID environment variable is missing. Configure Google credentials in the AI Studio environment.'
      });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/auth/callback/google`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      access_type: 'offline'
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url });
  } catch (err: any) {
    console.error('Google Auth URL generation error:', err);
    res.status(500).json({ error: 'Failed to generate Google auth URL' });
  }
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).send('<h1>Authorization code is missing</h1>');
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send('<h1>Google credentials missing on Server</h1>');
    return;
  }

  try {
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/auth/callback/google`;

    // 1. Exchange authorization code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errMsg = await tokenResponse.text();
      console.error('Google token response error:', errMsg);
      res.status(400).send(`<h1>Failed to exchange code</h1><p>${errMsg}</p>`);
      return;
    }

    const tokenData = await tokenResponse.json() as { access_token: string };

    // 2. Fetch user profile information using access_token
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      const errMsg = await profileResponse.text();
      res.status(400).send(`<h1>Failed to retrieve Google user profile</h1><p>${errMsg}</p>`);
      return;
    }

    const profile = await profileResponse.json() as { email?: string; name?: string; picture?: string };

    if (!profile.email) {
      res.status(400).send('<h1>No email address returned from Google oauth session</h1>');
      return;
    }

    const email = profile.email.trim().toLowerCase();
    const name = profile.name || email.split('@')[0];

    // 3. Upsert user in database
    let user = db.getUserByEmail(email);
    if (!user) {
      const dummyPasswordHash = await bcrypt.hash(Math.random().toString(36) + Date.now().toString(), 10);
      user = db.createUser(
        {
          name,
          email,
          role: 'Member', // Default role for social-login users
        },
        dummyPasswordHash
      );
    }

    // 4. Generate system token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7 days',
    });

    // 5. Send postMessage HTML response to close popup
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Identity Workspace Verification</title>
          <style>
            body {
              background-color: #09090b;
              color: #f8fafc;
              font-family: ui-sans-serif, system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              text-align: center;
              padding: 2.25rem;
              border: 1px solid #1e293b;
              border-radius: 12px;
              background-color: #111113;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
              max-width: 380px;
            }
            h1 {
              font-size: 1.15rem;
              margin-bottom: 0.5rem;
              font-weight: 600;
              letter-spacing: -0.025em;
            }
            p {
              color: #94a3b8;
              font-size: 0.85rem;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Workspace Sync Complete</h1>
            <p>Verification successful for Google profile: <strong>${email}</strong>. Handing environment over, closing panel...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                token: '${token}',
                user: ${JSON.stringify(user)}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Google OAuth execution failure:', error);
    res.status(500).send(`<h1>Authentication Error</h1><p>${error.message || 'Unknown state error'}</p>`);
  }
}

// 2. GitHub OAuth Endpoints
export function getGithubAuthUrl(req: Request, res: Response): void {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      res.status(400).json({
        error: 'GITHUB_CLIENT_ID environment variable is missing. Configure GitHub credentials in the AI Studio environment.'
      });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/auth/callback/github`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email'
    });

    const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
    res.json({ url });
  } catch (err: any) {
    console.error('GitHub Auth URL generation error:', err);
    res.status(500).json({ error: 'Failed to generate GitHub auth URL' });
  }
}

export async function githubCallback(req: Request, res: Response): Promise<void> {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).send('<h1>Authorization code is missing</h1>');
    return;
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send('<h1>GitHub credentials missing on Server</h1>');
    return;
  }

  try {
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/auth/callback/github`;

    // 1. Exchange authorization code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errMsg = await tokenResponse.text();
      console.error('GitHub token exchange error response:', errMsg);
      res.status(400).send(`<h1>Failed to exchange code</h1><p>${errMsg}</p>`);
      return;
    }

    const tokenData = await tokenResponse.json() as { access_token?: string; error?: string; error_description?: string };
    if (tokenData.error) {
      res.status(400).send(`<h1>GitHub OAuth Error</h1><p>${tokenData.error_description || tokenData.error}</p>`);
      return;
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      res.status(400).send('<h1>Access token not provided in GitHub response</h1>');
      return;
    }

    // 2. Fetch user profile info
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'User-Agent': 'Workspace-Project-Management-App',
      },
    });

    if (!profileResponse.ok) {
      const errMsg = await profileResponse.text();
      res.status(400).send(`<h1>Failed to retrieve GitHub profile</h1><p>${errMsg}</p>`);
      return;
    }

    const githubUser = await profileResponse.json() as { email?: string; name?: string; login: string };
    let email = githubUser.email?.trim().toLowerCase();
    const name = githubUser.name || githubUser.login;

    // 3. Fallback to /user/emails list if email is private or null
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'User-Agent': 'Workspace-Project-Management-App',
        },
      });
      if (emailResponse.ok) {
        const emails = await emailResponse.json() as { email: string; primary: boolean; verified: boolean }[];
        const primaryEmail = emails.find(e => e.primary && e.verified) || emails[0];
        if (primaryEmail) {
          email = primaryEmail.email.trim().toLowerCase();
        }
      }
    }

    if (!email) {
      res.status(400).send('<h1>No email address returned from your GitHub profile</h1><p>Please make your email public or select a registered profile.</p>');
      return;
    }

    // 4. Upsert user in database
    let user = db.getUserByEmail(email);
    if (!user) {
      const dummyPasswordHash = await bcrypt.hash(Math.random().toString(36) + Date.now().toString(), 10);
      user = db.createUser(
        {
          name,
          email,
          role: 'Member', // Default role for social-login users
        },
        dummyPasswordHash
      );
    }

    // 5. Generate system token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7 days',
    });

    // 6. Send postMessage HTML response to close popup
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GitHub Identity Workspace Verification</title>
          <style>
            body {
              background-color: #09090b;
              color: #f8fafc;
              font-family: ui-sans-serif, system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              text-align: center;
              padding: 2.25rem;
              border: 1px solid #1e293b;
              border-radius: 12px;
              background-color: #111113;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
              max-width: 380px;
            }
            h1 {
              font-size: 1.15rem;
              margin-bottom: 0.5rem;
              font-weight: 600;
              letter-spacing: -0.025em;
            }
            p {
              color: #94a3b8;
              font-size: 0.85rem;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Workspace Sync Complete</h1>
            <p>Verification successful for GitHub profile: <strong>${email}</strong>. Handing environment over, closing panel...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                token: '${token}',
                user: ${JSON.stringify(user)}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('GitHub OAuth execution failure:', error);
    res.status(500).send(`<h1>Authentication Error</h1><p>${error.message || 'Unknown state error'}</p>`);
  }
}
