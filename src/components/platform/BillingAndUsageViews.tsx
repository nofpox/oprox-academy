import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Zap,
  Download,
  CheckCircle2,
  HardDrive,
  Cpu,
  Users,
  AlertCircle,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Check,
  X
} from 'lucide-react';
import { PlatformViewId } from './platformTypes';

interface BillingViewsProps {
  viewId: PlatformViewId;
  theme?: 'dark' | 'light';
}

export interface SavedPaymentMethodUI {
  id: string;
  type: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export const BillingAndUsageViews: React.FC<BillingViewsProps> = ({ viewId, theme = 'dark' }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethodUI[]>([]);
  const [autoRenew, setAutoRenew] = useState<boolean>(false);
  const [prepaidActive, setPrepaidActive] = useState<boolean>(true);
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null);

  // Modal & Unified Checkout State
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<{ id: string; name: string; price: string }>({
    id: 'pro',
    name: 'Professional Plan',
    price: '187.50 SAR / mo'
  });
  const [savePaymentMethodInput, setSavePaymentMethodInput] = useState<boolean>(false); // Default: NO
  const [autoRenewInput, setAutoRenewInput] = useState<boolean>(false);               // Default: OFF
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);
  const [checkoutSuccessMsg, setCheckoutSuccessMsg] = useState<string | null>(null);

  // Saved Method Form
  const [showAddMethodModal, setShowAddMethodModal] = useState<boolean>(false);
  const [newMethodBrand, setNewMethodBrand] = useState<string>('Visa');
  const [newMethodLast4, setNewMethodLast4] = useState<string>('8888');

  useEffect(() => {
    fetch('/api/billing/invoices')
      .then((res) => res.json())
      .then((data) => {
        if (data.invoices && Array.isArray(data.invoices)) setInvoices(data.invoices);
        else if (Array.isArray(data)) setInvoices(data);
      })
      .catch(() => {});

    fetch('/api/billing/payment-methods')
      .then((res) => res.json())
      .then((data) => {
        if (data.savedPaymentMethods) setSavedPaymentMethods(data.savedPaymentMethods);
      })
      .catch(() => {});

    fetch('/api/billing/auto-renew')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.autoRenew === 'boolean') setAutoRenew(data.autoRenew);
      })
      .catch(() => {});

    fetch('/api/billing/prepaid-status')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setPrepaidActive(data.active !== false);
          setExpiredMessage(data.expiredMessage || null);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleAutoRenew = async (nextVal: boolean) => {
    setAutoRenew(nextVal);
    try {
      await fetch('/api/billing/auto-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRenew: nextVal })
      });
    } catch {}
  };

  const handleRemoveSavedMethod = async (id: string) => {
    try {
      await fetch(`/api/billing/payment-methods/${id}`, { method: 'DELETE' });
      setSavedPaymentMethods((prev) => prev.filter((m) => m.id !== id));
    } catch {}
  };

  const handleSetDefaultMethod = async (id: string) => {
    try {
      await fetch(`/api/billing/payment-methods/${id}/default`, { method: 'POST' });
      setSavedPaymentMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === id }))
      );
    } catch {}
  };

  const handleAddMethod = async () => {
    try {
      const res = await fetch('/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: newMethodBrand,
          last4: newMethodLast4,
          isDefault: savedPaymentMethods.length === 0
        })
      });
      const data = await res.json();
      if (data.paymentMethod) {
        setSavedPaymentMethods((prev) => [...prev, data.paymentMethod]);
        setShowAddMethodModal(false);
      }
    } catch {}
  };

  const handleExecuteUnifiedCheckout = async () => {
    setIsProcessingCheckout(true);
    setCheckoutSuccessMsg(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanForCheckout.id,
          savePaymentMethod: savePaymentMethodInput, // Default false
          autoRenew: autoRenewInput                  // Default false
        })
      });
      const data = await res.json();
      if (data.success) {
        setCheckoutSuccessMsg('Payment completed successfully via Unified Checkout!');
        setAutoRenew(autoRenewInput);
        setPrepaidActive(true);
        setExpiredMessage(null);
        setTimeout(() => {
          setShowCheckoutModal(false);
          setIsProcessingCheckout(false);
          setCheckoutSuccessMsg(null);
        }, 1200);
      } else {
        setIsProcessingCheckout(false);
      }
    } catch {
      setIsProcessingCheckout(false);
    }
  };

  if (viewId === 'billing') {
    return (
      <div className="space-y-6 select-none font-sans text-xs">
        {/* Prepaid Status Notice */}
        {!prepaidActive ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-sm text-amber-200">Services Suspended</h3>
              <p className="font-mono text-xs mt-0.5">
                {expiredMessage || "Your subscription or credits have expired. Please renew to continue."}
              </p>
              <button
                onClick={() => {
                  setSelectedPlanForCheckout({ id: 'pro', name: 'Professional Plan', price: '187.50 SAR / mo' });
                  setShowCheckoutModal(true);
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                <span>Pay Now & Renew</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Strictly Prepaid Engine
                </span>
                <p className="text-slate-300 font-mono text-[11px] mt-1">
                  OPROX is strictly PREPAID. No postpaid billing, no negative balance, no automatic debt, and no hidden charges.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold cursor-pointer transition-all shrink-0 flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Now</span>
            </button>
          </div>
        )}

        {/* Unified Payment Banner */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Unified Payment Experience
            </span>
            <h1 className="text-xl font-extrabold text-white mt-1">Payment Methods & Financial Controls</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Click <strong className="text-white">"Pay Now"</strong> for automated payment provider determination across Saudi & International payment instruments.
            </p>
          </div>

          <button
            onClick={() => setShowCheckoutModal(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay Now (Unified Checkout)</span>
          </button>
        </div>

        {/* Saved Methods & Auto-Renew Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span>Saved Payment Methods</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Saving a payment method is strictly optional (Default: Not Saved).
                </p>
              </div>

              <button
                onClick={() => setShowAddMethodModal(true)}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800 cursor-pointer flex items-center gap-1 font-mono font-bold text-[11px] px-2.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Method</span>
              </button>
            </div>

            {savedPaymentMethods.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 font-mono">
                No payment methods saved. Payment instruments are not stored by default.
              </div>
            ) : (
              <div className="space-y-3 font-mono">
                {savedPaymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-indigo-400 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {pm.brand || 'Visa / mada'} ending in •••• {pm.last4 || '4242'}
                          </span>
                          {pm.isDefault && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Expires {pm.expMonth || 12}/{pm.expYear || 2028}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!pm.isDefault && (
                        <button
                          onClick={() => handleSetDefaultMethod(pm.id)}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-bold cursor-pointer"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveSavedMethod(pm.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Auto-Renew Control</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Auto-Renew is disabled by default. Saving a payment method does NOT enable recurring charges.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-white text-xs block">Automatic Subscription Renewals</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {autoRenew ? 'Enabled: Subscription will auto-renew at term end.' : 'OFF (Default): No automatic recurring charges.'}
                </span>
              </div>

              <button
                onClick={() => handleToggleAutoRenew(!autoRenew)}
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                  autoRenew ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    autoRenew ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[11px] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-200">No Surprise Charges Guarantee:</strong>
                <p className="text-indigo-300/80 mt-0.5">
                  OPROX will never charge your payment method unless you actively initiate a checkout OR explicitly enable Auto-Renew.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Specifications */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>OPROX Commercial & Payment Policy Specifications</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="font-bold text-emerald-400 block">1. Strictly Prepaid</span>
              <p className="text-slate-400 leading-relaxed">
                No postpaid billing, no negative balance, and no automatic debt. Services are suspended immediately when credits reach zero.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="font-bold text-indigo-400 block">2. Optional Method Storage</span>
              <p className="text-slate-400 leading-relaxed">
                Saving payment instruments is strictly optional. Default during checkout is "Do Not Save".
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="font-bold text-cyan-400 block">3. Auto-Renew Disabled</span>
              <p className="text-slate-400 leading-relaxed">
                Auto-Renew defaults to OFF. Saving a card never turns on recurring billing automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>ZATCA E-Invoicing & Receipts</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-bold">Invoice ID</th>
                  <th className="pb-3 font-bold">Billing Period</th>
                  <th className="pb-3 font-bold">Amount</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">ZATCA PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {(invoices.length > 0 ? invoices : [
                  { id: 'inv_001', period: 'July 2026', amountDue: 29900, status: 'paid' },
                  { id: 'inv_002', period: 'June 2026', amountDue: 29900, status: 'paid' },
                ]).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 font-bold text-white">{inv.id}</td>
                    <td className="py-3 text-slate-400">{inv.period || 'Monthly Prepaid Plan'}</td>
                    <td className="py-3 text-emerald-400 font-bold">${((inv.amountDue || 29900) / 100).toFixed(2)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {inv.status || 'paid'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unified Checkout Modal */}
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl relative">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Unified Checkout
                </span>
                <h3 className="text-lg font-extrabold text-white mt-1">Pay Now — Single Flow</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Payment provider automatically routes to mada, STC Pay, Barq, Bank Transfer, Visa, or Mastercard.
                </p>
              </div>

              {checkoutSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{checkoutSuccessMsg}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Item Summary</span>
                <div className="flex justify-between text-xs font-extrabold text-white">
                  <span>{selectedPlanForCheckout.name}</span>
                  <span className="text-emerald-400">{selectedPlanForCheckout.price}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={savePaymentMethodInput}
                    onChange={(e) => setSavePaymentMethodInput(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold block text-white">Save this payment method for future payments?</span>
                    <span className="text-[10px] text-slate-400">Default: NO (Unchecked). Strictly opt-in.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={autoRenewInput}
                    onChange={(e) => setAutoRenewInput(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold block text-white">Enable Auto Renew for subscription renewals?</span>
                    <span className="text-[10px] text-slate-400">Default: OFF (Unchecked). Completely separate option.</span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  disabled={isProcessingCheckout}
                  onClick={handleExecuteUnifiedCheckout}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isProcessingCheckout ? 'Processing...' : 'Pay Now'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Method Modal */}
        {showAddMethodModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl relative">
              <button
                onClick={() => setShowAddMethodModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-extrabold text-white">Add Saved Payment Method</h3>
              <p className="text-xs text-slate-400">Optional method storage for future unified checkouts.</p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Brand / Instrument</label>
                  <select
                    value={newMethodBrand}
                    onChange={(e) => setNewMethodBrand(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="mada Debit">mada Debit</option>
                    <option value="STC Pay Wallet">STC Pay Wallet</option>
                    <option value="Barq Pay">Barq Pay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newMethodLast4}
                    onChange={(e) => setNewMethodLast4(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  />
                </div>
              </div>

              <button
                onClick={handleAddMethod}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold cursor-pointer transition-all"
              >
                Save Payment Instrument
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewId === 'subscription') {
    return (
      <div className="space-y-6 select-none font-sans text-xs">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white">OPROX Enterprise Tier Subscription</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Select a prepaid subscription plan. No postpaid billing, no negative balance, no automatic debt.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Prepaid Only Platform</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          {[
            {
              id: 'starter',
              title: 'Starter Plan',
              price: '37.50 SAR / mo',
              desc: 'Ideal for individual engineers and prototype teams.',
              features: ['10,000,000 AI Credits', '5 Team Member Seats', 'Standard Support', 'Cloud Run Deployments'],
              isCurrent: false
            },
            {
              id: 'pro',
              title: 'Professional Plan',
              price: '187.50 SAR / mo',
              desc: 'For scaling companies requiring autonomous AI agent swarms.',
              features: ['50,000,000 AI Credits', '15 Team Member Seats', 'Priority SLA Support', 'Team Collaboration & Workspace'],
              isCurrent: true
            },
            {
              id: 'enterprise',
              title: 'Enterprise Plan',
              price: '1,125.00 SAR / mo',
              desc: 'Dedicated single-tenant GCP Cloud Run deployment.',
              features: ['200,000,000 AI Credits', '50 Team Member Seats', '24/7 Dedicated SLA', 'SOC2 Compliance & Okta SSO'],
              isCurrent: false
            }
          ].map((plan) => (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl bg-slate-900 border flex flex-col justify-between space-y-6 ${
                plan.isCurrent ? 'border-emerald-500/50 shadow-xl shadow-emerald-500/10' : 'border-slate-800'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white">{plan.title}</h3>
                  {plan.isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active Tier
                    </span>
                  )}
                </div>

                <div className="text-2xl font-black text-emerald-400">{plan.price}</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{plan.desc}</p>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPlanForCheckout({ id: plan.id, name: plan.title, price: plan.price });
                  setShowCheckoutModal(true);
                }}
                className={`w-full py-2.5 rounded-xl font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  plan.isCurrent
                    ? 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{plan.isCurrent ? 'Renew Current Plan (Pay Now)' : 'Pay Now (Unified Checkout)'}</span>
              </button>
            </div>
          ))}
        </div>

        {showCheckoutModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl relative">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Unified Checkout
                </span>
                <h3 className="text-lg font-extrabold text-white mt-1">Pay Now — Single Flow</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Payment provider automatically routes to mada, STC Pay, Barq, Bank Transfer, Visa, or Mastercard.
                </p>
              </div>

              {checkoutSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{checkoutSuccessMsg}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Plan Selected</span>
                <div className="flex justify-between text-xs font-extrabold text-white">
                  <span>{selectedPlanForCheckout.name}</span>
                  <span className="text-emerald-400">{selectedPlanForCheckout.price}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={savePaymentMethodInput}
                    onChange={(e) => setSavePaymentMethodInput(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold block text-white">Save this payment method for future payments?</span>
                    <span className="text-[10px] text-slate-400">Default: NO (Unchecked). Strictly opt-in.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={autoRenewInput}
                    onChange={(e) => setAutoRenewInput(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold block text-white">Enable Auto Renew for subscription renewals?</span>
                    <span className="text-[10px] text-slate-400">Default: OFF (Unchecked). Completely separate option.</span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  disabled={isProcessingCheckout}
                  onClick={handleExecuteUnifiedCheckout}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isProcessingCheckout ? 'Processing...' : 'Pay Now'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewId === 'usage-quotas') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>Real-Time Usage Metering & Quota Gauges</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live consumption breakdown for Gemini tokens, Cloud Run compute, and Storage.
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-bold">Prepaid Credits Operational</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>AI Token Metering</span>
              </span>
              <span className="text-emerald-400 font-bold">34%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div className="h-full bg-emerald-500" style={{ width: '34%' }} />
            </div>
            <p className="text-slate-400 text-[11px]">17,000,000 / 50,000,000 tokens used</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>Media Storage</span>
              </span>
              <span className="text-cyan-400 font-bold">18%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div className="h-full bg-cyan-500" style={{ width: '18%' }} />
            </div>
            <p className="text-slate-400 text-[11px]">184 GB / 1,000 GB used</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Active Seat Licenses</span>
              </span>
              <span className="text-indigo-400 font-bold">48%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div className="h-full bg-indigo-500" style={{ width: '48%' }} />
            </div>
            <p className="text-slate-400 text-[11px]">24 / 50 team seats active</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
