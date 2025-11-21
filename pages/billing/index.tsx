import { useRouter } from "next/router";
import { useState } from "react";

export default function BillingTabsPage() {
  const router = useRouter();
  const { slug } = router.query;

  // Fake role for demo (SUPER_ADMIN / ADMIN)
  const role = "SUPER_ADMIN";

  // Active Tab
  const [tab, setTab] = useState("dashboard");

  // Fake Billing Summary
  const billing = {
    paymentMethod: "Visa •••• 4242",
    nextCharge: "₹499.00",
    nextChargeDate: "2025-02-12",
    overdue: false,
  };

  // Fake Invoices
  const invoices = [
    { id: "INV001", amount: "₹499", status: "Paid", date: "2025-01-12" },
    { id: "INV002", amount: "₹499", status: "Paid", date: "2024-12-12" },
  ];

  // Fake Usage Charges
  const usageCharges = [
    { item: "Extra Storage (10GB)", amount: "₹199", date: "2025-01-14" },
    { item: "AI Over-usage (200 scripts)", amount: "₹149", date: "2025-01-08" },
  ];

  // Fake Revenue analytics (Super Admin only)
  const revenueStats = {
    mrr: "₹1,48,200",
    activeSubscriptions: 41,
    cancelledThisMonth: 3,
    newThisMonth: 11,
  };

  // Fake Organizations Table (Super Admin)
  const organizations = [
    { name: "Green Valley High School", plan: "Pro", status: "Active", due: "0" },
    { name: "Sunlight Intl School", plan: "Basic", status: "Overdue", due: "₹499" },
    { name: "Elite Academy", plan: "Starter", status: "Trialing", due: "-" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">

      {/* ---------- PAGE HEADER ---------- */}
      <h1 className="text-3xl font-bold mb-8">Billing</h1>

      {/* ---------- TABS ---------- */}
      <div className="flex gap-6 border-b mb-10">
        {["dashboard", "invoices", "payment", "usage"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 px-1 text-lg font-medium border-b-2 ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}

        {role === "SUPER_ADMIN" && (
          <>
            <button
              onClick={() => setTab("organizations")}
              className={`pb-3 px-1 text-lg font-medium border-b-2 ${
                tab === "organizations"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              Organizations
            </button>

            <button
              onClick={() => setTab("revenue")}
              className={`pb-3 px-1 text-lg font-medium border-b-2 ${
                tab === "revenue"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              Revenue
            </button>
          </>
        )}
      </div>

      {/* ---------- TAB CONTENT ---------- */}
      {tab === "dashboard" && (
        <BillingDashboard billing={billing} role={role} />
      )}

      {tab === "invoices" && (
        <BillingInvoices invoices={invoices} />
      )}

      {tab === "payment" && (
        <PaymentMethodTab billing={billing} role={role} />
      )}

      {tab === "usage" && (
        <UsageChargesTab usageCharges={usageCharges} />
      )}

      {tab === "organizations" && role === "SUPER_ADMIN" && (
        <OrgBillingTab organizations={organizations} />
      )}

      {tab === "revenue" && role === "SUPER_ADMIN" && (
        <RevenueTab revenue={revenueStats} />
      )}
    </div>
  );
}

/* ============================================================
   TAB COMPONENTS
   ============================================================ */

/* ---------- 1. DASHBOARD TAB ---------- */
function BillingDashboard({ billing, role }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Billing Summary</h2>

      <div className="bg-white border shadow rounded-xl p-8 mb-8">
        <p className="text-gray-700 mb-1">
          <strong>Payment Method:</strong> {billing.paymentMethod}
        </p>

        <p className="text-gray-700 mb-1">
          <strong>Next Charge:</strong> {billing.nextCharge}
        </p>

        <p className="text-gray-700 mb-3">
          <strong>Next Charge Date:</strong> {billing.nextChargeDate}
        </p>

        {billing.overdue && (
          <p className="text-red-600 font-semibold">
            ⚠ Payment overdue – service may be locked soon.
          </p>
        )}

        {role === "SUPER_ADMIN" && (
          <button className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded">
            Override Billing
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- 2. INVOICES TAB ---------- */
function BillingInvoices({ invoices }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Invoices</h2>

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
            {invoices.map((inv) => (
              <tr className="border-b hover:bg-gray-50" key={inv.id}>
                <td className="p-3">{inv.id}</td>
                <td className="p-3">{inv.amount}</td>
                <td className="p-3">{inv.status}</td>
                <td className="p-3">{inv.date}</td>
                <td className="p-3">
                  <button className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700">
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- 3. PAYMENT METHOD TAB ---------- */
function PaymentMethodTab({ billing, role }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Payment Method</h2>

      <div className="bg-white border rounded-xl p-8 shadow">
        <p className="text-gray-700 mb-2">
          <strong>Current Method:</strong> {billing.paymentMethod}
        </p>

        <button className="bg-blue-600 text-white px-4 py-2 rounded mr-3">
          Update Card
        </button>

        {role === "SUPER_ADMIN" && (
          <button className="bg-yellow-600 text-white px-4 py-2 rounded">
            Override Payment Method
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- 4. USAGE CHARGES TAB ---------- */
function UsageChargesTab({ usageCharges }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Usage Charges</h2>

      <div className="bg-white border rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {usageCharges.map((charge, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="p-3">{charge.item}</td>
                <td className="p-3">{charge.amount}</td>
                <td className="p-3">{charge.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- 5. SUPER ADMIN — ORG BILLING TAB ---------- */
function OrgBillingTab({ organizations }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Organizations Billing</h2>

      <div className="bg-white border rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Organization</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Status</th>
              <th className="p-3">Due</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((o, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="p-3">{o.name}</td>
                <td className="p-3">{o.plan}</td>
                <td className="p-3">{o.status}</td>
                <td className="p-3">{o.due}</td>
                <td className="p-3">
                  <button className="text-blue-600 hover:underline mr-4">
                    View
                  </button>
                  <button className="text-yellow-600 hover:underline">
                    Override
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- 6. SUPER ADMIN — REVENUE TAB ---------- */
function RevenueTab({ revenue }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Revenue Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <RevenueCard title="MRR" value={revenue.mrr} />
        <RevenueCard title="Active Subscriptions" value={revenue.activeSubscriptions} />
        <RevenueCard title="New This Month" value={revenue.newThisMonth} />
        <RevenueCard title="Cancelled This Month" value={revenue.cancelledThisMonth} />
      </div>
    </div>
  );
}

function RevenueCard({ title, value }) {
  return (
    <div className="bg-white border shadow rounded-xl p-6">
      <p className="text-gray-600">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
