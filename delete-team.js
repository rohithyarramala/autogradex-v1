const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jackson = require('@boxyhq/saml-jackson');
const readline = require('readline');
const { Svix } = require('svix');

const svix = process.env.SVIX_API_KEY
  ? new Svix(`${process.env.SVIX_API_KEY}`)
  : undefined;

const product = process.env.JACKSON_PRODUCT_ID || 'boxyhq';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const jacksonOpts = {
  externalUrl: `${process.env.APP_URL}`,
  samlPath: '/api/oauth/saml',
  oidcPath: '/api/oauth/oidc',
  samlAudience: 'https://saml.boxyhq.com',
  db: {
    engine: 'sql',
    type: 'postgres',
    url: `${process.env.DATABASE_URL}`,
  },
  idpDiscoveryPath: '/auth/sso/idp-select',
  idpEnabled: true,
  openid: {},
};

const jacksonOptions = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.JACKSON_API_KEY}`,
  },
};

const useHostedJackson = process.env.JACKSON_URL ? true : false;

let jacksonInstance;

let dryRun = true;

init();

async function init() {
  if (process.argv.length < 3) {
    console.log(
      `
      Usage: 
        node delete-organization.js [options] <organizationId> [organizationId]
        npm run delete-organization -- [options] <organizationId> [organizationId]
        
      Options:
        --apply: Run the script to apply changes
        `
    );
    console.log(
      `
      Example: 
        node delete-organization.js --apply 01850e43-d1e0-4b92-abe5-271b159ff99b
        npm run delete-organization -- --apply 01850e43-d1e0-4b92-abe5-271b159ff99b
        `
    );
    process.exit(1);
  } else {
    if (!useHostedJackson) {
      console.log('Using embedded Jackson');
      jacksonInstance = await jackson.default(jacksonOpts);
    }
    let i = 2;
    if (process.argv.map((a) => a.toLowerCase()).includes('--apply')) {
      console.log('Running in apply mode');
      dryRun = false;
      i++;
    } else {
      console.log('Running in dry-run mode');
      dryRun = true;
    }
    for (i; i < process.argv.length; i++) {
      const organizationId = process.argv[i];
      try {
        await displayDeletionArtifacts(organizationId);

        if (!dryRun) {
          const confirmed = await askForConfirmation(organizationId);
          if (confirmed) {
            await handleTeamDeletion(organizationId);
          }
        }
      } catch (error) {
        console.log('Error deleting organization:', error?.message);
      }
    }
    await prisma.$disconnect();
    console.log('\nDisconnected from database');
    process.exit(0);
  }
}

async function displayDeletionArtifacts(organizationId) {
  // Team Details
  const organization = await getTeamById(organizationId);
  if (!organization) {
    throw new Error(`Team not found: ${organizationId}`);
  }
  console.log('\nTeam Details:');
  printTable([organization], ['id', 'name', 'billingId']);

  // SSO Connections
  const ssoConnections = await getSSOConnections({
    tenant: organization.id,
    product,
  });
  if (ssoConnections.length > 0) {
    console.log('\nSSO Connections:');
    printTable(ssoConnections, ['product', 'tenant', 'clientID']);
  } else {
    console.log('\nNo SSO connections found');
  }

  // DSync Connections
  const dsyncConnections = await getConnections(organization.id);
  if (dsyncConnections.length > 0) {
    console.log('\nDSync Connections:');
    printTable(dsyncConnections, ['id', 'type', 'name', 'product']);
  } else {
    console.log('\nNo DSync connections found');
  }

  if (organization?.billingId) {
    // Active Subscriptions
    const activeSubscriptions = await getActiveSubscriptions(organization);
    if (activeSubscriptions.length > 0) {
      console.log('\nActive Subscriptions:');
      printTable(activeSubscriptions, ['id', 'startDate', 'endDate']);
    } else {
      console.log('\nNo active subscriptions found');
    }

    // All subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        customerId: organization?.billingId,
      },
    });
    if (subscriptions.length > 0) {
      console.log('\nAll Subscriptions:');
      printTable(subscriptions, ['id', 'startDate', 'endDate', 'active']);
    } else {
      console.log('\nNo subscriptions found');
    }
  } else {
    console.log('\nNo billingId found');
  }

  // Team Members
  const organizationMembers = await prisma.user.findMany({
    where: {
      organizationMembers: {
        some: {
          organizationId: organization.id,
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
  for (let i = 0; i < organizationMembers.length; i++) {
    const user = organizationMembers[i];
    const userTeams = await prisma.organizationMember.findMany({
      where: {
        userId: user.id,
      },
    });
    organizationMembers[i].organizations = userTeams.length;
    organizationMembers[i].action = userTeams.length > 1 ? 'Remove' : 'Delete';
  }
  console.log('\nTeam Members:');
  printTable(organizationMembers, ['id', 'email', 'name', 'organizations', 'action']);

  const apiKeys = await prisma.apiKey.findMany({ where: { organizationId: organization.id } });
  if (apiKeys.length > 0) {
    console.log('\nAPI Keys:');
    printTable(apiKeys, ['id', 'name']);
  } else {
    console.log('\nNo API keys found');
  }

  const invitations = await prisma.invitation.findMany({
    where: { organizationId: organization.id },
  });
  if (invitations.length > 0) {
    console.log('\nInvitations:');
    printTable(invitations, ['id', 'email', 'role']);
  } else {
    console.log('\nNo invitations found');
  }

  if (svix) {
    console.log('\nChecking Svix application');
    const application = await getSvixApplication(organization.id);
    if (!application) {
      console.log('No Svix application found');
    } else {
      printTable([application], ['id', 'name', 'uid']);
      const webhooks = await svix.endpoint.list(application.id);
      if (webhooks?.data?.length) {
        console.log('\nSvix Webhooks:');
        printTable(webhooks.data, ['id', 'filterTypes', 'url']);
      } else {
        console.log('\nNo webhooks found');
      }
    }
  }
}

async function handleTeamDeletion(organizationId) {
  console.log(`\nChecking organization: ${organizationId}`);
  let organization = await getTeamById(organizationId);
  if (!organization) {
    console.log(`Team not found: ${organizationId}`);
    return;
  } else {
    console.log('Team found:', organization.name);
    if (organization?.billingId) {
      console.log('\nChecking active organization subscriptions');
      const activeSubscriptions = await getActiveSubscriptions(organization);
      if (activeSubscriptions.length > 0) {
        console.log(
          `${activeSubscriptions.length} Active subscriptions found. Please cancel them before deleting the organization.`
        );
        printTable(activeSubscriptions, ['id', 'startDate', 'endDate']);
        return;
      } else {
        console.log('No active subscriptions found');
      }
    }
    await removeDSyncConnections(organization);
    await removeSSOConnections(organization);
    await removeTeamSubscriptions(organization);
    await removeTeamMembers(organization);

    await removeSvixApplication(organization.id);

    await removeTeam(organization);
  }
}

async function getTeamById(organizationId) {
  return await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
  });
}

async function removeTeam(organization) {
  console.log('\nDeleting organization:', organization.id);
  await prisma.organization.delete({
    where: {
      id: organization.id,
    },
  });
  console.log('Team deleted:', organization.name);
}

async function removeSSOConnections(organization) {
  const params = {
    tenant: organization.id,
    product,
  };
  if (useHostedJackson) {
    const ssoUrl = `${process.env.JACKSON_URL}/api/v1/sso`;
    const query = new URLSearchParams(params);

    const response = await fetch(`${ssoUrl}?${query}`, {
      ...jacksonOptions,
      method: 'DELETE',
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error.message);
    }
  } else {
    const { apiController } = jacksonInstance;

    await apiController.deleteConnections(params);
  }
}

async function getSSOConnections(params) {
  if (useHostedJackson) {
    const ssoUrl = `${process.env.JACKSON_URL}/api/v1/sso`;
    const query = new URLSearchParams(params);

    const response = await fetch(`${ssoUrl}?${query}`, {
      ...jacksonOptions,
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error.message);
    }
    const data = await response.json();
    return data;
  } else {
    const { apiController } = jacksonInstance;

    return await apiController.getConnections(params);
  }
}

async function removeDSyncConnections(organization) {
  console.log(`\nChecking organization DSync connections`);
  const connections = await getConnections(organization.id);
  console.log(`Found ${connections.length} DSync connections`);
  for (const connection of connections) {
    console.log('\nDeleting DSync connection:', connection.id);
    await deleteConnection(connection.id);
    console.log('DSync connection deleted:', connection.id);
  }
  console.log(`\nDone removing organization DSync connections`);
}

async function removeTeamSubscriptions(organization) {
  console.log('\nDeleting organization subscriptions');
  if (organization?.billingId) {
    await prisma.subscription.deleteMany({
      where: {
        customerId: organization?.billingId,
      },
    });
  }
  console.log('Team subscriptions deleted');
}

async function getActiveSubscriptions(organization) {
  return await prisma.subscription.findMany({
    where: {
      customerId: organization?.billingId,
      active: true,
      endDate: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      customerId: true,
      startDate: true,
      endDate: true,
      priceId: true,
    },
  });
}

async function removeTeamMembers(organization) {
  console.log('\nChecking organization members');

  const organizationMembers = await prisma.user.findMany({
    where: {
      organizationMembers: {
        some: {
          organizationId: organization.id,
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
  console.log(`Found ${organizationMembers.length} organization members`);
  printTable(organizationMembers);

  for (const user of organizationMembers) {
    await checkAndRemoveUser(user, organization);
  }
}

async function checkAndRemoveUser(user, organization) {
  console.log('\nChecking user:', user.id);
  const userTeams = await prisma.organizationMember.findMany({
    where: {
      userId: user.id,
    },
  });
  console.log(`User belongs to ${userTeams.length} organizations`);
  if (userTeams.length === 1) {
    console.log('Deleting user:', user.email);
    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });
    console.log('User deleted:', user.email);
  } else {
    console.log('Removing user from organization:', organization.name);
    await prisma.organizationMember.deleteMany({
      where: {
        userId: user.id,
        organizationId: organization.id,
      },
    });
    console.log('User removed from organization:', organization.name);
  }
}

async function getConnections(tenant) {
  if (useHostedJackson) {
    const searchParams = new URLSearchParams({
      tenant: tenant,
      product,
    });

    const response = await fetch(
      `${process.env.JACKSON_URL}/api/v1/dsync?${searchParams}`,
      {
        ...jacksonOptions,
      }
    );

    const { data, error } = await response.json();

    if (!response.ok) {
      throw new Error(error.message);
    }

    return data;
  } else {
    const { directorySyncController } = jacksonInstance;

    const { data, error } =
      await directorySyncController.directories.getByTenantAndProduct(
        tenant,
        product
      );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

async function deleteConnection(directoryId) {
  if (useHostedJackson) {
    const response = await fetch(
      `${process.env.JACKSON_URL}/api/v1/dsync/${directoryId}`,
      {
        ...jacksonOptions,
        method: 'DELETE',
      }
    );

    const { data, error } = await response.json();

    if (!response.ok) {
      throw new Error(error.message);
    }

    return { data };
  } else {
    const { directorySyncController } = jacksonInstance;

    const { data, error } =
      await directorySyncController.directories.delete(directoryId);

    if (error) {
      throw new Error(error.message);
    }

    return { data };
  }
}

async function getSvixApplication(organizationId) {
  try {
    const application = await svix.application.get(organizationId);
    return application;
  } catch (ex) {
    console.log(
      'Error getting application:',
      ex?.code === 404 ? 'Not found' : ex
    );
  }
}

async function removeSvixApplication(organizationId) {
  if (!svix) {
    return;
  }
  console.log('\nDeleting Svix application:', organizationId);
  try {
    await svix.application.delete(organizationId);
  } catch (ex) {
    console.log(
      'Error deleting application:',
      ex?.code === 404 ? 'Not found' : ex
    );
  }
  console.log('Svix application deleted:', organizationId);
}

async function askForConfirmation(organizationId) {
  return new Promise((resolve) => {
    rl.question(
      `Are you sure you want to delete organization ${organizationId}? (yes/no): `,
      (answer) => {
        if (answer.toLowerCase() === 'yes') {
          resolve(true);
        } else {
          console.log('Deletion canceled.');
          resolve(false);
        }
        rl.close();
      }
    );
  });
}

function printTable(data, columns) {
  const final = {};
  data.forEach((ele, index) => {
    final[index + 1] = ele;
  });
  console.table(final, columns);
}

// handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
