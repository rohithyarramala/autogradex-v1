import { hashPassword } from '@/lib/auth';
import { slugify } from '@/lib/server-common';
import { sendVerificationEmail } from '@/lib/email/sendVerificationEmail';
import { isEmailAllowed } from '@/lib/email/utils';
import env from '@/lib/env';
import { ApiError } from '@/lib/errors';
import { createOrganization, getOrganization, isOrganizationExists } from 'models/organization';
import { createUser, getUser } from 'models/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';
import { getInvitation, isInvitationExpired } from 'models/invitation';
import { validateRecaptcha } from '@/lib/recaptcha';
import { slackNotify } from '@/lib/slack';
import { Organization } from '@prisma/client';
import { createVerificationToken } from 'models/verificationToken';
import { userJoinSchema, validateWithSchema } from '@/lib/zod';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'POST');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Signup the user
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name, password, organization, inviteToken, recaptchaToken } = req.body;

  await validateRecaptcha(recaptchaToken);

  const invitation = inviteToken
    ? await getInvitation({ token: inviteToken })
    : null;

  let email: string = req.body.email;

  // When join via invitation
  if (invitation) {
    if (await isInvitationExpired(invitation.expires)) {
      throw new ApiError(400, 'Invitation expired. Please request a new one.');
    }

    if (invitation.sentViaEmail) {
      email = invitation.email!;
    }
  }

  validateWithSchema(userJoinSchema, {
    name,
    email,
    password,
  });

  if (!isEmailAllowed(email)) {
    throw new ApiError(
      400,
      `We currently only accept work email addresses for sign-up. Please use your work email to create an account. If you don't have a work email, feel free to contact our support organization for assistance.`
    );
  }

  if (await getUser({ email })) {
    throw new ApiError(400, 'A user with this email already exists.');
  }


  // Check if organization name is available
  if (!invitation) {
    if (!organization) {
      throw new ApiError(400, 'An organization name is required.');
    }


    const slug = slugify(organization);

    validateWithSchema(userJoinSchema, { organization, slug });
    
    const slugCollisions = await isOrganizationExists(slug);

    if (slugCollisions > 0) {
      throw new ApiError(400, 'An organization with this slug already exists.');
    }
  }


  console.log("2");

  const user = await createUser({
    name,
    email,
    password: await hashPassword(password),
    emailVerified: invitation ? new Date() : null,
  });


  console.log("3");
  let userOrg: Organization | null = null;

  // Create organization if user is not invited
  // So we can create the org with the user as the owner
  if (!invitation) {
    userOrg = await createOrganization({
      userId: user.id,
      name: organization,
      slug: slugify(organization),
    });
  } else {
    userOrg = await getOrganization({ slug: invitation.organization.slug });
  }

  // Send account verification email
  if (env.confirmEmail && !user.emailVerified) {
    const verificationToken = await createVerificationToken({
      identifier: user.email,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendVerificationEmail({ user, verificationToken });
  }

  recordMetric('user.signup');

  slackNotify()?.alert({
    text: invitation
      ? 'New user signed up via invitation'
      : 'New user signed up',
    fields: {
      Name: user.name,
      Email: user.email,
      Organization: userOrg?.name,
    },
  });

  res.status(201).json({
    data: {
      confirmEmail: env.confirmEmail && !user.emailVerified,
    },
  });
};
