import {
  Button,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import EmailLayout from './EmailLayout';
import { Organization } from '@prisma/client';
import app from '@/lib/app';

interface TeamInviteEmailProps {
  organization: Organization;
  invitationLink: string;
  subject: string;
}

const TeamInviteEmail = ({
  organization,
  invitationLink,
  subject,
}: TeamInviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <EmailLayout>
        <Text>
          You have been invited to join the {organization.name} organization on {app.name}.
        </Text>
        <Text>
          Click the button below to accept the invitation and join the organization.
        </Text>
        <Container className="text-center">
          <Button
            href={invitationLink}
            className="bg-brand text-white font-medium py-2 px-4 rounded"
          >
            Join the organization
          </Button>
        </Container>
        <Text>
          You have 7 days to accept this invitation before it expires.
        </Text>
      </EmailLayout>
    </Html>
  );
};

export default TeamInviteEmail;
