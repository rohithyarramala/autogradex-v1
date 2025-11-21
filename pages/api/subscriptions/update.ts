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
    if (typeof organizationId !== "string" || !organizationId)
      return res.status(400).json({ error: "Invalid organization ID" });

    switch (req.method) {
      case "POST": {
        const { newPlanId } = JSON.parse(req.body);

        const org = await prisma.organization.findUniqueOrThrow({
          where: { id: organizationId },
          include: { subscriptions: true },
        });

        if (!org.subscriptionId)
          return res.status(400).json({ error: "No existing subscription" });

        await razorpay.subscriptions.update(org.subscriptionId, {
          plan_id: newPlanId,
          start_at: Math.floor(org.subscriptions[0].currentEnd!.getTime() / 1000),
        });

        await prisma.organization.update({
          where: { id: organizationId },
          data: { nextPlanId: newPlanId },
        });

        return res.status(200).json({ success: true });
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
