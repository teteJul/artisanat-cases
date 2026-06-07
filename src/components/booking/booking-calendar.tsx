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
  durationMinutes: number;
  price: number | string;
  maxParticipants: number;
  allowMultiPerson: boolean;
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

interface BookingCalendarProps {
  serviceTypes: ServiceType[];
  cancellationDeadlineHours?: number;
  giftVoucher?: GiftVoucher | null;
}

export function BookingCalendar({ serviceTypes, cancellationDeadlineHours = 48, giftVoucher }: BookingCalendarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const defaultParticipant = {
    firstName: session?.user?.name?.split(" ")[0] ?? "",
    lastName: session?.user?.name?.split(" ").slice(1).join(" ") ?? "",
    email: session?.user?.email ?? "",
  };
  const [participants, setParticipants] = useState([defaultParticipant]);
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "CARNET" | "SUBSCRIPTION" | "GIFT_VOUCHER">(
    giftVoucher ? "GIFT_VOUCHER" : "STRIPE"
  );
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState<"service" | "slot" | "participants" | "payment">("service");

  useEffect(() => {
    if (!session?.user) return;
    setParticipants([{
      firstName: session.user.name?.split(" ")[0] ?? "",
      lastName: session.user.name?.split(" ").slice(1).join(" ") ?? "",
      email: session.user.email ?? "",
    }]);
  }, [session]);

  useEffect(() => {
    if (!selectedService) return;
    setLoading(true);
    fetch(`/api/slots?serviceTypeId=${selectedService}`)
      .then((r) => r.json())
      .then((data) => setSlots(data))
      .finally(() => setLoading(false));
  }, [selectedService]);

  // Regrouper les créneaux par date
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

  async function handleBooking() {
    if (!session) {
      router.push("/connexion?callbackUrl=/reserver");
      return;
    }
    if (!selectedSlot) return;

    setBooking(true);
    const participantsToSend = selectedServiceType?.allowMultiPerson
      ? participants.filter((p) => p.firstName && p.lastName)
      : [{
          firstName: session.user.name?.split(" ")[0] ?? "Client",
          lastName: session.user.name?.split(" ").slice(1).join(" ") ?? "",
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
      }),
    });

    const data = await res.json();
    if (data.checkoutUrl) {
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

    await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseSlotId: selectedSlot.id }),
    });

    alert("Vous avez été ajouté à la liste d'attente. Nous vous préviendrons si une place se libère.");
  }

  const selectedServiceType = serviceTypes.find((s) => s.id === selectedService);

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
                onClick={() => { setSelectedService(service.id); setSelectedSlot(null); setStep("slot"); }}
                className={`text-left border rounded-xl p-4 transition-all ${
                  selectedService === service.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <p className="font-medium text-foreground text-sm">{service.name}</p>
                <p className="text-primary font-semibold text-sm mt-1">{formatPrice(Number(service.price))}</p>
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
                          onClick={() => { setSelectedSlot(slot); setStep("participants"); }}
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
        {selectedSlot && !selectedSlot.isFull && selectedServiceType?.allowMultiPerson && (
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
                  {giftVoucher && paymentMethod === "GIFT_VOUCHER" ? (() => {
                    const fullPrice = Number(selectedSlot.serviceType.price) * participants.length;
                    const remaining = Math.max(0, fullPrice - giftVoucher.amountValue);
                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Prix</span>
                          <span>{formatPrice(fullPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-green-700">
                          <span>Bon cadeau</span>
                          <span>- {formatPrice(Math.min(giftVoucher.amountValue, fullPrice))}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-border">
                          <p className="text-xs text-muted-foreground font-medium">Reste à payer</p>
                          <p className={`text-xl font-bold ${remaining === 0 ? "text-green-600" : "text-primary"}`}>
                            {formatPrice(remaining)}
                          </p>
                        </div>
                      </div>
                    );
                  })() : (
                    <>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-primary">
                        {formatPrice(Number(selectedSlot.serviceType.price) * participants.length)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {giftVoucher && paymentMethod === "GIFT_VOUCHER" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-green-800 font-medium">🎁 Bon cadeau appliqué</p>
                  <p className="text-xs text-green-700 mt-0.5">{giftVoucher.code} — {formatPrice(giftVoucher.amountValue)}</p>
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
                  <p className="text-sm text-destructive font-medium">Ce créneau est complet.</p>
                  <button
                    onClick={handleWaitlist}
                    className="w-full border border-primary text-primary py-2.5 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors"
                  >
                    Rejoindre la liste d'attente
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleBooking}
                  disabled={booking || (selectedServiceType?.allowMultiPerson && (!participants[0].firstName || !participants[0].lastName))}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {booking ? "Confirmation..." : giftVoucher && paymentMethod === "GIFT_VOUCHER"
                    ? Math.max(0, Number(selectedSlot.serviceType.price) * participants.length - giftVoucher.amountValue) === 0
                      ? "Confirmer avec mon bon cadeau"
                      : `Payer ${formatPrice(Math.max(0, Number(selectedSlot.serviceType.price) * participants.length - giftVoucher.amountValue))} et réserver`
                    : "Payer et réserver"}
                  <ChevronRight className="w-4 h-4" />
                </button>
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
