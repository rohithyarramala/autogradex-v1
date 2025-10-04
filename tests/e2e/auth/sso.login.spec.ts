import { test as base } from '@playwright/test';
import { user, organization, secondTeam } from '../support/helper';
import { LoginPage, SSOPage, SettingsPage } from '../support/fixtures';

const SSO_METADATA_URL = [
  `${process.env.MOCKSAML_ORIGIN}/api/saml/metadata`,
  `${process.env.MOCKSAML_ORIGIN}/api/namespace/test/saml/metadata`,
];

type SSOLoginFixture = {
  loginPage: LoginPage;
  ssoPageTeam: SSOPage;
  ssoPageSecondTeam: SSOPage;
  settingsPage: SettingsPage;
};

const test = base.extend<SSOLoginFixture>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(loginPage);
  },
  ssoPageTeam: async ({ page }, use) => {
    const ssoPage = new SSOPage(page, organization.slug);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(ssoPage);
  },
  ssoPageSecondTeam: async ({ page }, use) => {
    const ssoPage = new SSOPage(page, secondTeam.slug);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(ssoPage);
  },
  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page, user.name);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(settingsPage);
  },
});

test('Create SSO connection for organization', async ({
  loginPage,
  ssoPageTeam: ssoPage,
}) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(organization.slug);
  await ssoPage.goto();
  await ssoPage.createSSOConnection({ metadataUrl: SSO_METADATA_URL[0] });
});

test('Login with SSO', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.ssoLogin(user.email);
  await loginPage.loggedInCheck(organization.slug);
});

test('Create a new organization', async ({ settingsPage, loginPage }) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(organization.slug);
  await settingsPage.createNewTeam(secondTeam.name);
});

test('SSO login with 2 organizations & one SSO connection', async ({
  loginPage,
  settingsPage,
}) => {
  await loginPage.goto();
  await loginPage.ssoLogin(user.email);
  await settingsPage.isLoggedIn();
});

test('Create SSO connection for new organization', async ({
  loginPage,
  ssoPageSecondTeam: ssoPage,
  settingsPage,
}) => {
  await loginPage.goto();
  await loginPage.ssoLogin(user.email);
  await settingsPage.isLoggedIn();

  await ssoPage.goto();
  await ssoPage.createSSOConnection({ metadataUrl: SSO_METADATA_URL[1] });
});

test('SSO login with 2 organizations & two SSO connection', async ({
  loginPage,
  ssoPageSecondTeam: ssoPage,
}) => {
  await loginPage.goto();
  await loginPage.ssoLogin(user.email, true);

  await loginPage.isMultipleTeamErrorVisible();

  await loginPage.ssoLoginWithSlug(organization.slug);
  await ssoPage.goto();

  await ssoPage.openEditSSOConnectionView();
  await ssoPage.deleteSSOConnection();
  await ssoPage.checkEmptyConnectionList();
});

test('Delete SSO connection', async ({
  loginPage,
  ssoPageTeam: ssoPage,
  settingsPage,
}) => {
  await loginPage.goto();
  await loginPage.ssoLogin(user.email);
  await settingsPage.isLoggedIn();

  await ssoPage.goto();
  await ssoPage.openEditSSOConnectionView();
  await ssoPage.deleteSSOConnection();
  await ssoPage.checkEmptyConnectionList();
});

test('Remove second organization', async ({ loginPage, settingsPage }) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await settingsPage.isLoggedIn();

  await settingsPage.removeTeam(secondTeam.slug);
});
