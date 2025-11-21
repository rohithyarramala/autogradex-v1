import { useRouter } from "next/router";
import { useState } from "react";

/**
 * Helper: load Razorpay checkout script and wait until window.Razorpay exists.
 * Returns a promise that resolves to window.Razorpay or rejects on timeout.
 */
function loadRazorpayScript(timeout = 10000): Promise<any> {
  return new Promise((resolve, reject) => {
    // already loaded
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      return resolve((window as any).Razorpay);
    }

    // check if script already injected
    const existing = document.querySelector('script[data-razorpay="checkout"]');
    if (existing) {
      const checkInterval = setInterval(() => {
        if ((window as any).Razorpay) {
          clearInterval(checkInterval);
          resolve((window as any).Razorpay);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        if ((window as any).Razorpay) return resolve((window as any).Razorpay);
        reject(new Error("Razorpay script load timeout"));
      }, timeout);
      return;
    }

    // inject script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.setAttribute("data-razorpay", "checkout");
    script.onload = () => {
      if ((window as any).Razorpay) return resolve((window as any).Razorpay);
      // small delay to ensure global is ready
      const checkInterval = setInterval(() => {
        if ((window as any).Razorpay) {
          clearInterval(checkInterval);
          resolve((window as any).Razorpay);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkInterval);
        if ((window as any).Razorpay) return resolve((window as any).Razorpay);
        reject(new Error("Razorpay failed to initialize after load"));
      }, 3000);
    };
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.head.appendChild(script);
  });
}

/**
 * RazorpayButton — waits for script, opens checkout.
 * Props:
 *  - label: button label
 *  - amount: in paise (e.g., 49900 for ₹499)
 *  - planId: string used only for notes/description; for subscription flow you'll pass subscription_id instead
 */
function RazorpayButton({ label, amount = 49900, planId = "pro" }: { label: string; amount?: number; planId?: string }) {
  const [loading, setLoading] = useState(false);

  const openRazorpay = async () => {
    try {
      setLoading(true);
      const Razorpay = await loadRazorpayScript();

      const key = process.env.RZP_KEY_SECRET || "rzp_test_Rg5HORrS1fHMxW"; // replace with NEXT_PUBLIC_RZP_KEY

      // Example: simple one-time payment. For subscriptions you should create a subscription server-side
      // and pass subscription_id instead of amount (see comment below).
      const options: any = {
        key,
        amount, // amount in paise (only for one-time payment)
        currency: "INR",
        name: "Renitiate",
        description: `Subscribe to ${planId}`,
        handler: function (response: any) {
          // Payment successful — call your backend to verify + create subscription record
          console.log("razorpay success", response);
          alert("Payment successful: " + response.razorpay_payment_id);
          // Example: POST to /api/subscriptions/confirm with response to verify signature & update DB
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
        },
        notes: {
          plan: planId,
        },
        theme: {
          color: "#1976d2",
        },
      };

      // If you have a server-generated `subscription_id` (for Razorpay Subscriptions),
      // use:
      // options = { ...options, subscription_id: "<server_generated_subscription_id>" };
      // and do NOT set `amount`.

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay error", err);
      alert("Payment failed to start: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={openRazorpay}
      disabled={loading}
      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 px-4 rounded-lg shadow-sm transition"
    >
      {loading ? "Opening..." : `${label} with Razorpay`}
    </button>
  );
}

/* -------------------------
   Full page (tabs + content)
   ------------------------- */
export default function SubscriptionsTabsPage() {
  const router = useRouter();
  const { slug } = router.query;

  // switch role to ADMIN or SUPER_ADMIN to test
  const role = "ADMIN" as "ADMIN" | "SUPER_ADMIN";

  const [tab, setTab] = useState("dashboard");

  // Fake org + usage/plans/invoices — replace with real data later
  const org = { name: "Green Valley High School", planId: "basic", subscriptionStatus: "active", trialEndsAt: "" };
  const usage = { teachers: { used: 4, limit: 10 }, students: { used: 320, limit: 500 }, ai: { used: 1400, limit: 2000 }, storage: { used: 40, limit: 100 } };
  const plans = [
    { id: "free", name: "Free", price: 0, limits: { teachers: 1, students: 50, ai: 50, storage: "1GB" }, features: ["Basic AI", "No automation"] },
    { id: "basic", name: "Basic", price: 29900, limits: { teachers: 2, students: 200, ai: 200, storage: "10GB" }, features: ["AI Eval", "Basic Support"] },
    { id: "pro", name: "Pro", price: 49900, limits: { teachers: 10, students: 500, ai: 2000, storage: "100GB" }, features: ["Automation", "Priority Support"] },
  ];
  const invoices = [{ id: "INV_001", amount: "₹499", status: "Paid", date: "2025-01-12" }, { id: "INV_002", amount: "₹499", status: "Paid", date: "2024-12-12" }];

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Subscriptions</h1>

      <div className="flex gap-6 border-b mb-10">
        {["dashboard", "plans", "usage", "billing"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 px-1 text-lg font-medium border-b-2 ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        {role === "SUPER_ADMIN" && <button onClick={() => setTab("organizations")} className={`pb-3 px-1 text-lg font-medium border-b-2 ${tab === "organizations" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}>Organizations</button>}
      </div>

      <div>
        {tab === "dashboard" && <DashboardTab role={role} usage={usage} org={org} />}
        {tab === "plans" && <PlansTab plans={plans} org={org} role={role} />}
        {tab === "usage" && <UsageTab usage={usage} org={org} role={role} plans={plans} />}
        {tab === "billing" && <BillingTab invoices={invoices} role={role} billing={{ nextCharge: "₹499", paymentMethod: "Visa •••• 4242", nextChargeDate: "2025-02-12" }} />}
        {tab === "organizations" && role === "SUPER_ADMIN" && <OrganizationsTab />}
      </div>
    </div>
  );
}

/* ------ Tab components (unchanged UI) ------ */

function DashboardTab({ role, usage, org }: any) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>

      {role === "SUPER_ADMIN" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Total Organizations" value="47" />
          <Card title="Active Subscriptions" value="41" />
          <Card title="Monthly Revenue" value="₹1,48,500" />
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-4">Usage Summary</h3>
          <UsageBars usage={usage} />
        </div>
      )}
    </div>
  );
}

function PlansTab({ plans, org, role }: any) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Plans</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((p: any) => {
          const isCurrent = p.id === org.planId;
          return (
            <div key={p.id} className={`relative p-6 rounded-xl border shadow ${isCurrent ? "border-blue-600" : "border-gray-200"}`}>
              {isCurrent && <span className="absolute bg-blue-600 text-white px-3 py-1 text-xs rounded-full right-4 top-4">Current</span>}

              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="text-gray-600 mb-2">₹{p.price / 100} / month</p>

              <pre className="bg-gray-100 text-xs p-3 rounded-lg mb-4">{JSON.stringify(p.limits, null, 2)}</pre>

              {role === "SUPER_ADMIN" ? (
                <button className="w-full py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Edit Plan</button>
              ) : (
                <div className="flex flex-col gap-3">
                  <button className={`w-full py-2 rounded text-white ${isCurrent ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`} disabled={isCurrent}>
                    {isCurrent ? "Current Plan" : "Upgrade"}
                  </button>

                  {!isCurrent && <RazorpayButton label="Subscribe" planId={p.id} amount={p.price} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UsageTab({ usage, org, role }: any) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Usage Details</h2>

      <UsageBars usage={usage} />

      {role === "SUPER_ADMIN" ? (
        <div className="mt-8 bg-yellow-50 border border-yellow-300 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Super Admin Overrides</h3>

          <button className="mr-4 bg-yellow-600 text-white px-4 py-2 rounded">Force Upgrade</button>

          <button className="bg-yellow-600 text-white px-4 py-2 rounded">Force Downgrade</button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Upgrade Plan</button>

          <RazorpayButton label="Upgrade with Razorpay" planId={"pro"} />
        </div>
      )}
    </div>
  );
}

function BillingTab({ invoices, billing, role }: any) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Billing</h2>

      <div className="bg-white border rounded-xl shadow p-6 mb-8">
        <p className="text-gray-700 mb-1"><strong>Payment Method:</strong> {billing.paymentMethod}</p>
        <p className="text-gray-700 mb-1"><strong>Next Charge:</strong> {billing.nextCharge}</p>
        <p className="text-gray-700 mb-1"><strong>Next Charge Date:</strong> {billing.nextChargeDate}</p>

        {role !== "SUPER_ADMIN" && (
          <div className="mt-6">
            <RazorpayButton label="Pay Now" amount={49900} />
          </div>
        )}

        {role === "SUPER_ADMIN" && (
          <button className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded">Override Billing</button>
        )}
      </div>

      <h3 className="text-xl font-semibold mb-3">Invoices</h3>
      <div className="bg-white border rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Invoice</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Download</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv: any) => (
              <tr key={inv.id} className="border-b">
                <td className="p-3">{inv.id}</td>
                <td className="p-3">{inv.amount}</td>
                <td className="p-3">{inv.status}</td>
                <td className="p-3">{inv.date}</td>
                <td className="p-3">
                  <button className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700">Download PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrganizationsTab() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">All Organizations</h2>
      <p className="text-gray-600 mb-4">View and manage subscriptions across all organizations.</p>

      <div className="bg-white border rounded-xl shadow p-6">
        <p className="text-gray-700">[Super Admin Organization List Placeholder]</p>
      </div>
    </div>
  );
}

/* small components */
function Card({ title, value }: any) {
  return (
    <div className="bg-white border shadow rounded-xl p-6">
      <p className="text-gray-600">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function UsageBars({ usage }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Object.entries(usage).map(([key, value]: any) => (
        <div key={key} className="bg-white border rounded-xl p-6 shadow">
          <h3 className="font-semibold capitalize">{key}</h3>
          <p className="mt-1 text-gray-700">{value.used} / {value.limit}</p>
          <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(value.used / value.limit) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
