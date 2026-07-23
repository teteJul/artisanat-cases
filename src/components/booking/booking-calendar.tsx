"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { Calendar, Clock, Users, ChevronRight, AlertCircle } from "lucide-react";

interface ServiceType {
  id: string;
  name: string;
  type: string;
  pricingType: "PER_PERSON" | "FIXED";
  durationMinutes: number;
  price: number | string;
  maxParticipants: number;
  allowMultiPerson: boolean;
  allowCarnet: boolean;
  color: string | null;
}

interface Slot {
  id: string;
  serviceTypeId: string;
  serviceType: ServiceType;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  bookedCount: number;
  availableSpots: number;
  isFull: boolean;
  waitlistCount: number;
}

interface GiftVoucher {
  id: string;
  code: string;
  description: string | null;
  amountValue: number;
}

interface ActiveSubscription {
  id: string;
  remainingCredits: number;
  endDate: string;
  plan: { name: string; totalCourses: number };
}

interface ActiveCarnet {
  id: string;
  serviceTypeId: string;
  totalCredits: number;
  usedCredits: number;
  expiresAt: string;
}

interface BookingCalendarProps {
  serviceTypes: ServiceType[];
  cancellationDeadlineHours?: number;
  giftVoucher?: GiftVoucher | null;
  preselectedServiceId?: string;
  preselectedSlotId?: string;
  activeSubscriptions?: ActiveSubscription[];
  activeCarnets?: ActiveCarnet[];
  totalCredit?: number;
}

export function BookingCalendar({
  serviceTypes,
  cancellationDeadlineHours = 48,
  giftVoucher,
  preselectedServiceId,
  preselectedSlotId,
  activeSubscriptions = [],
  activeCarnets = [],
  totalCredit = 0,
}: BookingCalendarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string | null>(preselectedServiceId ?? null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const defaultParticipant = {
    firstName: session?.user?.name?.split(" ")[0] ?? "",
    lastName: session?.user?.name?.split(" ").slice(1).join(" ") || "-",
    email: session?.user?.email ?? "",
  };
  const [participants, setParticipants] = useState([defaultParticipant]);
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "CARNET" | "SUBSCRIPTION" | "GIFT_VOUCHER" | "CREDIT">(
    giftVoucher ? "GIFT_VOUCHER" : activeSubscriptions.length > 0 ? "SUBSCRIPTION" : "STRIPE"
  );
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>(
    activeSubscriptions[0]?.id ?? ""
  );
  const [selectedCarnetId, setSelectedCarnetId] = useState<string>("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");

  useEffect(() => {
    if (!session?.user) return;
    setParticipants([{
      firstName: session.user.name?.split(" ")[0] ?? "",
      lastName: session.user.name?.split(" ").slice(1).join(" ") || "-",
      email: session.user.email ?? "",
    }]);
  }, [session]);

  useEffect(() => {
    if (!selectedService) return;
    const svc = serviceTypes.find((s) => s.id === selectedService);
    // Réinitialiser le mode de paiement si le service ne le supporte plus
    if (svc?.type !== "COLLECTIVE_POTTERY" && paymentMethod === "SUBSCRIPTION") {
      setPaymentMethod("STRIPE");
    }
    if (!svc?.allowCarnet && paymentMethod === "CARNET") {
      setPaymentMethod("STRIPE");
    }
    setLoading(true);
    fetch(`/api/slots?serviceTypeId=${selectedService}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data);
        if (preselectedSlotId) {
          const slot = data.find((s: Slot) => s.id === preselectedSlotId);
          if (slot) setSelectedSlot(slot);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedService]);

  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const date = new Date(slot.startTime).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  const selectedServiceType = serviceTypes.find((s) => s.id === selectedService);

  // Carnets utilisables pour le service sélectionné
  const availableCarnets = activeCarnets.filter(
    (c) => c.serviceTypeId === selectedService && c.totalCredits - c.usedCredits > 0
  );

  // Prix total pour le nombre de participants sélectionnés
  const fullPrice = selectedSlot
    ? selectedSlot.serviceType.pricingType === "FIXED"
      ? Number(selectedSlot.serviceType.price)
      : Number(selectedSlot.serviceType.price) * participants.length
    : 0;

  const canPayWithCredit = totalCredit >= fullPrice && fullPrice > 0;

  const showPaymentSelector = !giftVoucher && (
    (activeSubscriptions.length > 0 && selectedServiceType?.type === "COLLECTIVE_POTTERY") ||
    (selectedServiceType?.allowCarnet && availableCarnets.length > 0) ||
    canPayWithCredit
  );

  async function handleBooking() {
    if (!session) {
      router.push("/connexion?callbackUrl=/reserver");
      return;
    }
    if (!selectedSlot) return;

    setBooking(true);
    setBookingError("");
    const participantsToSend =
      selectedServiceType?.allowMultiPerson && paymentMethod !== "SUBSCRIPTION"
        ? participants.filter((p) => p.firstName && p.lastName)
        : [{
            firstName: session.user.name?.split(" ")[0] ?? "Client",
            lastName: session.user.name?.split(" ").slice(1).join(" ") || "-",
            email: session.user.email ?? "",
          }];

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseSlotId: selectedSlot.id,
        paymentMethod,
        participants: participantsToSend,
        giftVoucherId: paymentMethod === "GIFT_VOUCHER" && giftVoucher ? giftVoucher.id : undefined,
        subscriptionId: paymentMethod === "SUBSCRIPTION" ? selectedSubscriptionId : undefined,
        carnetId: paymentMethod === "CARNET" ? selectedCarnetId : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setBookingError(data.error ?? "Une erreur est survenue. Veuillez réessayer.");
    } else if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else if (data.bookingId) {
      router.push(`/mon-espace/reservations?success=true&bookingId=${data.bookingId}`);
    }
    setBooking(false);
  }

  async function handleWaitlist() {
    if (!session) {
      router.push("/connexion?callbackUrl=/reserver");
      return;
    }
    if (!selectedSlot) return;

    setWaitlistError("");
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseSlotId: selectedSlot.id }),
    });

    const data = await res.json();
    if (!res.ok) {
      setWaitlistError(data.error ?? "Une erreur est survenue.");
    } else {
      setWaitlistSuccess(true);
    }
  }

  function getButtonLabel() {
    if (booking) return "Confirmation...";
    if (paymentMethod === "SUBSCRIPTION") return "Réserver avec mon abonnement";
    if (paymentMethod === "CARNET") return "Réserver avec mon carnet";
    if (paymentMethod === "CREDIT") return "Réserver avec mes avoirs";
    if (giftVoucher && paymentMethod === "GIFT_VOUCHER") {
      const isFixed = selectedSlot?.serviceType.pricingType === "FIXED";
      const total = isFixed
        ? Number(selectedSlot?.serviceType.price ?? 0)
        : Number(selectedSlot?.serviceType.price ?? 0) * participants.length;
      const remaining = Math.max(0, total - giftVoucher.amountValue);
      return remaining === 0 ? "Confirmer avec mon bon cadeau" : `Payer ${formatPrice(remaining)} et réserver`;
    }
    return `Payer ${formatPrice(fullPrice)} et réserver`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Colonne gauche : sélection service + créneaux */}
      <div className="lg:col-span-2">
        {/* Étape 1 : Choisir le service */}
        <div className="mb-6">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">1</span>
            Choisissez votre activité
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {serviceTypes.map((service) => (
              <button
                key={service.id}
                onClick={() => { setSelectedService(service.id); setSelectedSlot(null); }}
                className={`text-left border rounded-xl p-4 transition-all ${
                  selectedService === service.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <p className="font-medium text-foreground text-sm">{service.name}</p>
                <p className="text-primary font-semibold text-sm mt-1">
                  {formatPrice(Number(service.price))}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {service.pricingType === "PER_PERSON" ? "/ pers." : "forfait"}
                  </span>
                </p>
                <p className="text-muted-foreground text-xs mt-1">{service.durationMinutes} min · max {service.maxParticipants} pers.</p>
              </button>
            ))}
          </div>
        </div>

        {/* Étape 2 : Choisir le créneau */}
        {selectedService && (
          <div className="mb-6">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">2</span>
              Choisissez votre créneau
            </h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement des créneaux...</div>
            ) : Object.keys(slotsByDate).length === 0 ? (
              <div className="text-center py-8 bg-card border border-border rounded-xl">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Aucun créneau disponible pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(slotsByDate).map(([date, daySlots]) => (
                  <div key={date}>
                    <p className="text-sm font-medium text-muted-foreground mb-2 capitalize">{date}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {daySlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => { setSelectedSlot(slot); }}
                          className={`border rounded-lg p-3 text-left transition-all ${
                            selectedSlot?.id === slot.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : slot.isFull
                              ? "border-border bg-muted/50 opacity-70"
                              : "border-border bg-card hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {formatTime(slot.startTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            {slot.isFull ? (
                              <span className="text-xs text-destructive">Complet</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {slot.availableSpots} place{slot.availableSpots > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          {slot.isFull && slot.waitlistCount > 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                              {slot.waitlistCount} en attente
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Étape 3 : Participants */}
        {selectedSlot && !selectedSlot.isFull && selectedServiceType?.allowMultiPerson && paymentMethod !== "SUBSCRIPTION" && (
          <div ref={(el) => { if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 50); }}>
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">3</span>
              Participants
            </h2>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              {participants.map((p, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Prénom *"
                    value={p.firstName}
                    onChange={(e) => {
                      const newP = [...participants];
                      newP[i] = { ...p, firstName: e.target.value };
                      setParticipants(newP);
                    }}
                    className="border border-input rounded-lg px-3 py-2 text-sm bg-background"
                  />
                  <input
                    type="text"
                    placeholder="Nom *"
                    value={p.lastName}
                    onChange={(e) => {
                      const newP = [...participants];
                      newP[i] = { ...p, lastName: e.target.value };
                      setParticipants(newP);
                    }}
                    className="border border-input rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
              ))}
              {participants.length < selectedSlot.availableSpots && (
                <button
                  onClick={() => setParticipants([...participants, { firstName: "", lastName: "", email: "" }])}
                  className="text-sm text-primary hover:underline"
                >
                  + Ajouter un participant
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Colonne droite : récapitulatif */}
      <div className="lg:col-span-1">
        <div className="bg-card border border-border rounded-xl p-6 sticky top-20">
          <h3 className="font-semibold text-foreground mb-4">Récapitulatif</h3>

          {!selectedSlot ? (
            <p className="text-muted-foreground text-sm">Sélectionnez un créneau pour continuer.</p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="font-medium text-foreground text-sm">{selectedSlot.serviceType.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date & heure</p>
                  <p className="font-medium text-foreground text-sm">
                    {formatDate(selectedSlot.startTime)} à {formatTime(selectedSlot.startTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Participants</p>
                  <p className="font-medium text-foreground text-sm">{participants.length}</p>
                </div>
                <div className="pt-3 border-t border-border">
                  {paymentMethod === "SUBSCRIPTION" ? (
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-green-600">Inclus dans l'abonnement</p>
                    </div>
                  ) : paymentMethod === "CARNET" ? (
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-green-600">Inclus dans le carnet</p>
                    </div>
                  ) : paymentMethod === "CREDIT" ? (
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-green-600">Payé avec mes avoirs</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatPrice(totalCredit - fullPrice)} restant après réservation
                      </p>
                    </div>
                  ) : giftVoucher && paymentMethod === "GIFT_VOUCHER" ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Prix{selectedSlot.serviceType.pricingType !== "FIXED" && participants.length > 1 ? ` (×${participants.length})` : ""}</span>
                        <span>{formatPrice(fullPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-green-700">
                        <span>Bon cadeau</span>
                        <span>- {formatPrice(Math.min(giftVoucher.amountValue, fullPrice))}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border">
                        <p className="text-xs text-muted-foreground font-medium">Reste à payer</p>
                        <p className={`text-xl font-bold ${Math.max(0, fullPrice - giftVoucher.amountValue) === 0 ? "text-green-600" : "text-primary"}`}>
                          {formatPrice(Math.max(0, fullPrice - giftVoucher.amountValue))}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total{selectedSlot.serviceType.pricingType !== "FIXED" && participants.length > 1 ? ` (×${participants.length})` : ""}
                      </p>
                      <p className="text-xl font-bold text-primary">{formatPrice(fullPrice)}</p>
                    </div>
                  )}
                </div>
              </div>

              {giftVoucher && paymentMethod === "GIFT_VOUCHER" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-green-800 font-medium">🎁 Bon cadeau appliqué</p>
                  <p className="text-xs text-green-700 mt-0.5">{giftVoucher.code} — {formatPrice(giftVoucher.amountValue)}</p>
                </div>
              )}

              {/* Sélecteur mode de paiement */}
              {showPaymentSelector && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Mode de paiement</p>
                  <div className="space-y-2">
                    {/* Abonnements */}
                    {activeSubscriptions.length > 0 && selectedServiceType?.type === "COLLECTIVE_POTTERY" &&
                      activeSubscriptions.map((sub) => (
                        <label key={sub.id} className={`flex items-start gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "SUBSCRIPTION" && selectedSubscriptionId === sub.id ? "border-primary bg-primary/5" : "border-border"}`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={sub.id}
                            checked={paymentMethod === "SUBSCRIPTION" && selectedSubscriptionId === sub.id}
                            onChange={() => { setPaymentMethod("SUBSCRIPTION"); setSelectedSubscriptionId(sub.id); setParticipants([participants[0]]); }}
                            className="mt-0.5"
                          />
                          <div>
                            <p className="text-xs font-medium text-foreground">{sub.plan.name}</p>
                            <p className="text-xs text-muted-foreground">{sub.remainingCredits} cours restants · exp. {new Date(sub.endDate).toLocaleDateString("fr-FR")}</p>
                          </div>
                        </label>
                      ))
                    }

                    {/* Carnets */}
                    {selectedServiceType?.allowCarnet && availableCarnets.length > 0 &&
                      availableCarnets.map((carnet) => (
                        <label key={carnet.id} className={`flex items-start gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "CARNET" && selectedCarnetId === carnet.id ? "border-primary bg-primary/5" : "border-border"}`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={carnet.id}
                            checked={paymentMethod === "CARNET" && selectedCarnetId === carnet.id}
                            onChange={() => { setPaymentMethod("CARNET"); setSelectedCarnetId(carnet.id); }}
                            className="mt-0.5"
                          />
                          <div>
                            <p className="text-xs font-medium text-foreground">Carnet de cours</p>
                            <p className="text-xs text-muted-foreground">{carnet.totalCredits - carnet.usedCredits} crédit{carnet.totalCredits - carnet.usedCredits > 1 ? "s" : ""} restant{carnet.totalCredits - carnet.usedCredits > 1 ? "s" : ""} · exp. {new Date(carnet.expiresAt).toLocaleDateString("fr-FR")}</p>
                          </div>
                        </label>
                      ))
                    }

                    {/* Avoir */}
                    {canPayWithCredit && (
                      <label className={`flex items-start gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "CREDIT" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CREDIT"
                          checked={paymentMethod === "CREDIT"}
                          onChange={() => setPaymentMethod("CREDIT")}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-xs font-medium text-foreground">Avoir ({formatPrice(totalCredit)})</p>
                          <p className="text-xs text-muted-foreground">Utilisable immédiatement</p>
                        </div>
                      </label>
                    )}

                    {/* Carte bancaire */}
                    <label className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "STRIPE" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <input type="radio" name="paymentMethod" value="STRIPE" checked={paymentMethod === "STRIPE"} onChange={() => setPaymentMethod("STRIPE")} className="mt-0.5" />
                      <p className="text-xs font-medium text-foreground">Payer par carte</p>
                    </label>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Annulation gratuite jusqu'à {cancellationDeadlineHours}h avant le cours.
                  </p>
                </div>
              </div>

              {selectedSlot.isFull ? (
                <div className="space-y-2">
                  {waitlistSuccess ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-800">✅ Vous êtes sur la liste d'attente !</p>
                      <p className="text-xs text-green-700 mt-1">Vous recevrez un email dès qu'une place se libère sur ce créneau.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-destructive font-medium">Ce créneau est complet.</p>
                      {waitlistError && (
                        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{waitlistError}</p>
                      )}
                      <button
                        onClick={handleWaitlist}
                        className="w-full border border-primary text-primary py-2.5 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors"
                      >
                        Rejoindre la liste d'attente
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {bookingError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-3">
                      ❌ {bookingError}
                    </div>
                  )}
                  <button
                    onClick={handleBooking}
                    disabled={
                      booking ||
                      (selectedServiceType?.allowMultiPerson && (!participants[0].firstName || !participants[0].lastName)) ||
                      (paymentMethod === "CARNET" && !selectedCarnetId)
                    }
                    className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {getButtonLabel()}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {!session && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Vous serez redirigé vers la connexion.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
