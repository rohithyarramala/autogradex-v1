import { render } from '@react-email/components';
import { sendEmail } from './sendEmail';
import { WelcomeEmail } from '@/components/emailTemplates';

export const sendWelcomeEmail = async (
  name: string,
  email: string,
  organization: string
) => {
  const subject = 'Welcome to BoxyHQ';
  const html = await render(WelcomeEmail({ name, organization, subject }));

  await sendEmail({
    to: email,
    subject,
    html,
  });
};
