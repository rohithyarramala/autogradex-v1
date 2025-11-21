import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

    const organizationId = session.user.organizationId;
    if (!organizationId) return res.status(400).json({ error: "Invalid organization" });

    switch (req.method) {
      case "GET": {
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          include: {
            subscriptions: true,
          },
        });

        const plans = await prisma.servicePlan.findMany();

        return res.status(200).json({
          org,
          subscription: org?.subscriptions?.[0] || null,
          plans,
        });
      }

      default:
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end();
    }
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
