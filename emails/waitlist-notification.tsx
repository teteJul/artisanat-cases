import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WaitlistNotificationEmailProps {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  bookingUrl: string;
}

export default function WaitlistNotificationEmail({
  clientName,
  serviceName,
  date,
  time,
  bookingUrl,
}: WaitlistNotificationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Une place s'est libérée — {serviceName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Artisanat Cases</Heading>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={h2}>
              🎉 Une place vient de se libérer !
            </Heading>
            <Text style={text}>Bonjour {clientName},</Text>
            <Text style={text}>
              Bonne nouvelle ! Une place s'est libérée pour le cours de{" "}
              <strong>{serviceName}</strong> du <strong>{date}</strong> à{" "}
              <strong>{time}</strong>.
            </Text>
            <Text style={text}>
              Cliquez sur le bouton ci-dessous pour finaliser votre réservation. La place sera
              attribuée à la première personne qui confirme.
            </Text>
            <Button style={button} href={bookingUrl}>
              Réserver ma place
            </Button>
            <Text style={note}>
              Ce mail a été envoyé à toutes les personnes en liste d'attente.
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>Artisanat Cases · manon@artisanatcases.fr</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#faf7f2", fontFamily: "'Georgia', serif" };
const container = { maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "8px", overflow: "hidden" };
const header = { backgroundColor: "#b5552a", padding: "24px 40px", textAlign: "center" as const };
const logo = { color: "#ffffff", fontSize: "24px", margin: "0", fontWeight: "400", letterSpacing: "2px" };
const content = { padding: "40px" };
const h2 = { color: "#3d2314", fontSize: "22px" };
const text = { color: "#5c3d2e", fontSize: "15px", lineHeight: "24px" };
const button = { backgroundColor: "#b5552a", color: "#ffffff", padding: "14px 28px", borderRadius: "6px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block", marginTop: "8px" };
const note = { color: "#9a6b50", fontSize: "12px", marginTop: "16px", fontStyle: "italic" };
const footer = { backgroundColor: "#faf7f2", padding: "20px 40px", borderTop: "1px solid #e8d5c4" };
const footerText = { color: "#9a6b50", fontSize: "12px", textAlign: "center" as const };
