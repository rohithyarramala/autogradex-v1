import { Invitation, Organization } from '@prisma/client';
import { sendEmail } from './sendEmail';
import { TeamInviteEmail } from '@/components/emailTemplates';
import { render } from '@react-email/components';
import env from '../env';
import app from '../app';

export const sendTeamInviteEmail = async (
  organization: Organization,
  invitation: Invitation
) => {
  if (!invitation.email) {
    return;
  }

  const subject = `You've been invited to join ${organization.name} on ${app.name}`;
  const invitationLink = `${env.appUrl}/invitations/${invitation.token}`;

  const html = await render(TeamInviteEmail({ invitationLink, organization, subject }));

  await sendEmail({
    to: invitation.email,
    subject,
    html,
  });
};
