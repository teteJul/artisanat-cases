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

interface BookingReminderEmailProps {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  appUrl: string;
}

export default function BookingReminderEmail({
  clientName,
  serviceName,
  date,
  time,
  appUrl,
}: BookingReminderEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Rappel — Votre cours demain : {serviceName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Artisanat Cases</Heading>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={h2}>
              On vous attend demain !
            </Heading>
            <Text style={text}>Bonjour {clientName},</Text>
            <Text style={text}>
              C'est un rappel pour votre cours de <strong>{serviceName}</strong> prévu le{" "}
              <strong>{date}</strong> à <strong>{time}</strong>.
            </Text>
            <Text style={text}>
              N'oubliez pas de venir avec des vêtements que vous ne craignez pas de salir. À
              demain !
            </Text>
            <Button style={button} href={`${appUrl}/mon-espace/reservations`}>
              Voir ma réservation
            </Button>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              Artisanat Cases · contact@artisanatcases.fr
            </Text>
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
const button = { backgroundColor: "#b5552a", color: "#ffffff", padding: "14px 28px", borderRadius: "6px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block" };
const footer = { backgroundColor: "#faf7f2", padding: "20px 40px", borderTop: "1px solid #e8d5c4" };
const footerText = { color: "#9a6b50", fontSize: "12px", textAlign: "center" as const };
