import { test as base } from '@playwright/test';
import { user, organization } from '../support/helper';
import { JoinPage, LoginPage, SettingsPage } from '../support/fixtures';
import { prisma } from '@/lib/prisma';

const organizationNewInfo = {
  name: 'New Team Name',
  slug: 'new organization example',
  sluggified: 'new-organization-example',
} as const;

type TeamSettingsFixture = {
  loginPage: LoginPage;
  joinPage: JoinPage;
  settingsPage: SettingsPage;
};

const test = base.extend<TeamSettingsFixture>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(loginPage);
  },
  joinPage: async ({ page }, use) => {
    const joinPage = new JoinPage(page, user, organization.name);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(joinPage);
  },
  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page, organization.slug);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(settingsPage);
  },
});

test.afterAll(async () => {
  await prisma.organization.update({
    where: { slug: organizationNewInfo.sluggified },
    data: { name: organization.name, slug: organization.slug },
  });
});

test('Should be able to update organization name', async ({
  loginPage,
  settingsPage,
}) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(organization.slug);

  await settingsPage.goto(organization.slug);
  await settingsPage.updateTeamName(organizationNewInfo.name);

  await settingsPage.page.reload();
  await settingsPage.isSettingsPageVisible();
  await settingsPage.checkTeamName(organizationNewInfo.name);
});

test('Should not allow to update organization name with empty value', async ({
  loginPage,
  settingsPage,
}) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(organization.slug);

  await settingsPage.goto(organization.slug);
  await settingsPage.fillTeamName('');
  await settingsPage.isSaveButtonDisabled();
});

test('Should not allow to update organization name with more than 50 characters', async ({
  loginPage,
  settingsPage,
}) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(organization.slug);

  await settingsPage.goto(organization.slug);
  await settingsPage.fillTeamName('a'.repeat(51));
  await settingsPage.isSaveButtonDisabled();
  await settingsPage.isTeamNameLengthErrorVisible();
});

test('Should be able to update organization slug', async ({
  loginPage,
  settingsPage,
}) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(organization.slug);

  await settingsPage.goto(organization.slug);
  await settingsPage.updateTeamSlug(organizationNewInfo.slug);

  await settingsPage.isSettingsPageVisible();
  await settingsPage.checkTeamSlug(organizationNewInfo.sluggified);
});

test('Should not allow empty slug', async ({ loginPage, settingsPage }) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(organizationNewInfo.sluggified);

  await settingsPage.goto(organizationNewInfo.sluggified);
  await settingsPage.fillTeamSlug('');
  await settingsPage.isSaveButtonDisabled();
});

test('Should not allow to update organization slug with more than 50 characters', async ({
  loginPage,
  settingsPage,
}) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(organizationNewInfo.sluggified);

  await settingsPage.goto(organizationNewInfo.sluggified);
  await settingsPage.fillTeamSlug('a'.repeat(51));
  await settingsPage.isSaveButtonDisabled();
  await settingsPage.isTeamSlugLengthErrorVisible();
});

test('Should be able to set domain in organization settings', async ({
  loginPage,
  settingsPage,
}) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(organizationNewInfo.sluggified);

  await settingsPage.goto(organizationNewInfo.sluggified);
  await settingsPage.updateDomain('example.com');
  await settingsPage.page.reload();
  await settingsPage.isSettingsPageVisible();
  await settingsPage.checkDomain('example.com');
});

test('Should not allow to set domain with more than 253 characters', async ({
  loginPage,
  settingsPage,
}) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(organizationNewInfo.sluggified);

  await settingsPage.goto(organizationNewInfo.sluggified);
  await settingsPage.fillDomain('a'.repeat(256) + '.com');
  await settingsPage.isSaveButtonDisabled();
  await settingsPage.isDomainLengthErrorVisible();
});

test('Should not allow to set invalid domain', async ({
  loginPage,
  settingsPage,
}) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(organizationNewInfo.sluggified);

  await settingsPage.goto(organizationNewInfo.sluggified);
  await settingsPage.fillDomain('example');
  await settingsPage.isSaveButtonDisabled();
  await settingsPage.isDomainInvalidErrorVisible();
});
