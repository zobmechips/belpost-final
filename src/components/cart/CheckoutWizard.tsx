import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { OrderReceipt } from "@/components/cart/OrderReceipt";
import { useApp, type CartItem } from "@/context/AppProvider";
import { api, isValidEmail, isValidPhone } from "@/lib/api";

type CheckoutWizardProps = {
  open: boolean;
  onClose: () => void;
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 280 : -280, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -280 : 280, opacity: 0 }),
};

export function CheckoutWizard({ open, onClose }: CheckoutWizardProps) {
  const { cart, removeFromCart, clearCart, tr, pushToast, user } = useApp();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<{ orderId: string; createdAt: string; items: CartItem[]; total: number } | null>(null);

  const [sender, setSender] = useState({ name: "", phone: "", email: user?.email ?? "" });
  const [recipient, setRecipient] = useState({ name: "", phone: "", email: "" });
  const [delivery, setDelivery] = useState<{ method: "courier" | "office"; postalCode: string; address: string }>({
    method: "courier",
    postalCode: "",
    address: "",
  });

  const total = cart.reduce((s, i) => s + i.price * (i.qty ?? 1), 0);

  const goTo = (next: number) => {
    if (next === 1) {
      if (!sender.name.trim() || !recipient.name.trim()) {
        pushToast("Заполните ФИО отправителя и получателя", "error");
        return;
      }
      if (!isValidPhone(sender.phone) || !isValidPhone(recipient.phone)) {
        pushToast("Телефон в формате +375XXXXXXXXX", "error");
        return;
      }
      if (!isValidEmail(sender.email) || !isValidEmail(recipient.email)) {
        pushToast("Некорректный Email", "error");
        return;
      }
    }
    if (next === 2) {
      if (delivery.method === "office" && !/^\d{6}$/.test(delivery.postalCode)) {
        pushToast("Индекс — 6 цифр", "error");
        return;
      }
      if (delivery.method === "courier" && !delivery.address.trim()) {
        pushToast("Укажите адрес доставки", "error");
        return;
      }
    }
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const reset = () => {
    setStep(0);
    setDirection(1);
    onClose();
  };

  const finish = async () => {
    setSaving(true);
    try {
      const snapshot = [...cart];
      const result = await api.createOrder({
        userEmail: user?.email ?? sender.email,
        sender,
        recipient,
        delivery,
        items: cart,
        total,
      });
      clearCart();
      pushToast(tr("cart", "success"), "success");
      setReceipt({
        orderId: result.order?.id ?? crypto.randomUUID(),
        createdAt: result.order?.createdAt ?? new Date().toISOString(),
        items: snapshot,
        total,
      });
      setStep(0);
      setDirection(1);
      onClose();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <OrderReceipt
        open={!!receipt}
        onClose={() => setReceipt(null)}
        orderId={receipt?.orderId ?? ""}
        items={receipt?.items ?? []}
        total={receipt?.total ?? 0}
        senderName={sender.name}
        createdAt={receipt?.createdAt ?? new Date().toISOString()}
      />
    <AnimatePresence>
      {open && (
        <motion.div className="fluid-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={reset}>
          <motion.aside
            className="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cart-drawer-header">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">{tr("cart", "title")}</h3>
              </div>
              <button type="button" onClick={reset} className="fluid-modal-close" aria-label={tr("common", "close")}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="cart-stepper-dots">
              {[tr("cart", "stepItems"), tr("cart", "stepDelivery"), tr("cart", "stepConfirm")].map((label, i) => (
                <button key={label} type="button" onClick={() => i < step && goTo(i)} className={`cart-step-dot ${step === i ? "is-active" : ""}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="cart-drawer-body">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 0 && (
                  <motion.div key="s0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 280, damping: 30 }}>
                    {cart.length === 0 ? (
                      <p className="text-sm text-slate-500">{tr("cart", "empty")}</p>
                    ) : (
                      cart.map((item: CartItem) => (
                        <div key={item.id} className="cart-item mb-2">
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-brand">{item.price.toFixed(2)} BYN</p>
                          </div>
                          <button type="button" onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                    <div className="cart-total">
                      <span>{tr("cart", "total")}</span>
                      <strong>{total.toFixed(2)} BYN</strong>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">{tr("cart", "sender")}</p>
                      <input placeholder={tr("cart", "name")} value={sender.name} onChange={(e) => setSender({ ...sender, name: e.target.value })} className="fluid-input" />
                      <input placeholder={tr("cart", "phone")} value={sender.phone} onChange={(e) => setSender({ ...sender, phone: e.target.value })} className="fluid-input" />
                      <input placeholder={tr("cart", "email")} value={sender.email} onChange={(e) => setSender({ ...sender, email: e.target.value })} className="fluid-input" />
                      <p className="text-xs font-semibold uppercase text-slate-500">{tr("cart", "recipient")}</p>
                      <input placeholder={tr("cart", "name")} value={recipient.name} onChange={(e) => setRecipient({ ...recipient, name: e.target.value })} className="fluid-input" />
                      <input placeholder={tr("cart", "phone")} value={recipient.phone} onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })} className="fluid-input" />
                      <input placeholder={tr("cart", "email")} value={recipient.email} onChange={(e) => setRecipient({ ...recipient, email: e.target.value })} className="fluid-input" />
                    </div>
                  </motion.div>
                )}
                {step === 1 && (
                  <motion.div key="s1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-4">
                    <p className="text-sm font-semibold">{tr("cart", "deliveryMethod")}</p>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={delivery.method === "courier"} onChange={() => setDelivery({ ...delivery, method: "courier" })} />
                      {tr("cart", "courier")}
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={delivery.method === "office"} onChange={() => setDelivery({ ...delivery, method: "office" })} />
                      {tr("cart", "office")}
                    </label>
                    {delivery.method === "courier" ? (
                      <input placeholder="Адрес доставки" value={delivery.address} onChange={(e) => setDelivery({ ...delivery, address: e.target.value })} className="fluid-input" />
                    ) : (
                      <input placeholder={tr("cart", "postalCode")} value={delivery.postalCode} onChange={(e) => setDelivery({ ...delivery, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="fluid-input" maxLength={6} />
                    )}
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div key="s2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-2 text-sm">
                    <h4 className="font-semibold">{tr("cart", "receipt")}</h4>
                    <p>{tr("cart", "sender")}: {sender.name}</p>
                    <p>{tr("cart", "recipient")}: {recipient.name}</p>
                    <p>{tr("cart", "deliveryMethod")}: {delivery.method === "courier" ? tr("cart", "courier") : tr("cart", "office")}</p>
                    <p className="text-lg font-bold text-brand">{tr("cart", "total")}: {total.toFixed(2)} BYN</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="cart-drawer-footer">
              {step > 0 && (
                <button type="button" onClick={() => goTo(step - 1)} className="btn-ghost">
                  <ArrowLeft className="h-4 w-4" /> {tr("cart", "back")}
                </button>
              )}
              {step < 2 ? (
                <button type="button" disabled={step === 0 && cart.length === 0} onClick={() => goTo(step + 1)} className="btn-primary ml-auto">
                  {tr("cart", "next")} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" disabled={saving} onClick={() => void finish()} className="btn-primary ml-auto">
                  {saving ? "…" : tr("cart", "checkout")}
                </button>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
