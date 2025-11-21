import { NextApiRequest, NextApiResponse } from "next";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const razorpay = new Razorpay({
  key_id: process.env.RZP_KEY_ID!,
  key_secret: process.env.RZP_KEY_SECRET!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

    const organizationId = session.user.organizationId;
    if (typeof organizationId !== "string" || !organizationId) {
      return res.status(400).json({ error: "Invalid organizationId" });
    }

    switch (req.method) {
      case "POST": {
        const { planId } = JSON.parse(req.body);

        const org = await prisma.organization.findUniqueOrThrow({
          where: { id: organizationId },
        });

        const rzpSub = await razorpay.subscriptions.create({
          plan_id: planId,
          total_count: 12,
          customer_notify: 1,
          notes: { orgId: organizationId },
        });

        await prisma.subscription.create({
          data: {
            id: rzpSub.id,
            planId,
            organizationId,
            status: rzpSub.status,
            currentStart: rzpSub.current_start ? new Date(rzpSub.current_start * 1000) : null,
            currentEnd: rzpSub.current_end ? new Date(rzpSub.current_end * 1000) : null,
            notes: rzpSub.notes,
          },
        });

        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            subscriptionId: rzpSub.id,
            planId,
            subscriptionStatus: rzpSub.status,
            trialEndsAt: null,
          },
        });

        return res.status(201).json({ success: true, subscriptionId: rzpSub.id });
      }

      default:
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end();
    }
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}

