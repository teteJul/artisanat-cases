import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface BookingConfirmationEmailProps {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  location?: string;
  bookingId: string;
  participants?: { firstName: string; lastName: string }[];
  paymentMethod: string;
  totalPaid?: string;
  appUrl: string;
}

export default function BookingConfirmationEmail({
  clientName,
  serviceName,
  date,
  time,
  bookingId,
  participants,
  paymentMethod,
  totalPaid,
  appUrl,
}: BookingConfirmationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Confirmation de votre réservation — {serviceName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Artisanat Cases</Heading>
            <Text style={tagline}>Atelier de poterie</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={h2}>
              Votre réservation est confirmée !
            </Heading>
            <Text style={text}>Bonjour {clientName},</Text>
            <Text style={text}>
              Nous avons bien reçu votre réservation. À très bientôt à l'atelier !
            </Text>

            <Section style={card}>
              <Text style={cardLabel}>Service</Text>
              <Text style={cardValue}>{serviceName}</Text>

              <Hr style={divider} />

              <Text style={cardLabel}>Date</Text>
              <Text style={cardValue}>{date}</Text>

              <Text style={cardLabel}>Heure</Text>
              <Text style={cardValue}>{time}</Text>

              <Hr style={divider} />

              {participants && participants.length > 1 && (
                <>
                  <Text style={cardLabel}>Participants</Text>
                  {participants.map((p, i) => (
                    <Text key={i} style={cardValue}>
                      {p.firstName} {p.lastName}
                    </Text>
                  ))}
                  <Hr style={divider} />
                </>
              )}

              <Text style={cardLabel}>Mode de paiement</Text>
              <Text style={cardValue}>{paymentMethod}</Text>

              {totalPaid && (
                <>
                  <Text style={cardLabel}>Montant payé</Text>
                  <Text style={cardValue}>{totalPaid}</Text>
                </>
              )}

              <Hr style={divider} />

              <Text style={cardLabel}>Référence</Text>
              <Text style={{ ...cardValue, fontFamily: "monospace", fontSize: "12px" }}>
                {bookingId}
              </Text>
            </Section>

            <Section style={infoBox}>
              <Text style={infoText}>
                ⏰ <strong>Annulation</strong> : vous pouvez annuler gratuitement jusqu'à 48h avant
                le cours. Au-delà, le cours sera considéré comme utilisé.
              </Text>
            </Section>

            <Button style={button} href={`${appUrl}/mon-espace/reservations`}>
              Voir ma réservation
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Artisanat Cases — Atelier de poterie
              <br />
              Pour toute question : contact@artisanatcases.fr
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#faf7f2",
  fontFamily: "'Georgia', 'Times New Roman', serif",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
};

const header = {
  backgroundColor: "#b5552a",
  padding: "32px 40px",
  textAlign: "center" as const,
};

const logo = {
  color: "#ffffff",
  fontSize: "28px",
  margin: "0",
  fontWeight: "400",
  letterSpacing: "2px",
};

const tagline = {
  color: "#f5dece",
  fontSize: "13px",
  margin: "4px 0 0",
  letterSpacing: "3px",
  textTransform: "uppercase" as const,
};

const content = {
  padding: "40px",
};

const h2 = {
  color: "#3d2314",
  fontSize: "22px",
  fontWeight: "600",
  marginBottom: "8px",
};

const text = {
  color: "#5c3d2e",
  fontSize: "15px",
  lineHeight: "24px",
};

const card = {
  backgroundColor: "#fdf8f3",
  border: "1px solid #e8d5c4",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const cardLabel = {
  color: "#9a6b50",
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 4px",
};

const cardValue = {
  color: "#3d2314",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const divider = {
  borderColor: "#e8d5c4",
  margin: "16px 0",
};

const infoBox = {
  backgroundColor: "#fff9f0",
  border: "1px solid #f0d9c0",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
};

const infoText = {
  color: "#7a4f2e",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const button = {
  backgroundColor: "#b5552a",
  color: "#ffffff",
  padding: "14px 28px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "8px",
};

const footer = {
  backgroundColor: "#faf7f2",
  padding: "24px 40px",
  borderTop: "1px solid #e8d5c4",
};

const footerText = {
  color: "#9a6b50",
  fontSize: "12px",
  textAlign: "center" as const,
  lineHeight: "20px",
};
