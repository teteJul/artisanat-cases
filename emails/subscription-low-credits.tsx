import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";

interface SubscriptionLowCreditsEmailProps {
  clientName: string;
  planName: string;
  remainingCredits: number;
  endDate: string;
  appUrl: string;
}

export default function SubscriptionLowCreditsEmail({
  clientName,
  planName,
  remainingCredits,
  endDate,
  appUrl,
}: SubscriptionLowCreditsEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{`Plus que ${remainingCredits} cours restant sur votre abonnement ${planName}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Artisanat Cases</Heading>
            <Text style={tagline}>Atelier de poterie</Text>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Plus que {remainingCredits} cours sur votre abonnement
            </Heading>
            <Text style={text}>Bonjour {clientName},</Text>
            <Text style={text}>
              Il ne vous reste plus que <strong>{remainingCredits} cours</strong> sur votre abonnement <strong>{planName}</strong>, valable jusqu'au {endDate}.
            </Text>
            <Section style={warningBox}>
              <Text style={warningText}>
                ⏰ Pensez à renouveler votre abonnement ou à réserver vos derniers cours avant l'expiration.
              </Text>
            </Section>
            <Button style={button} href={`${appUrl}/reserver`}>
              Réserver mon cours
            </Button>
            <Text style={{ ...text, marginTop: "16px" }}>
              <a href={`${appUrl}/mon-espace/carnets`} style={{ color: "#b5552a" }}>
                Voir mon abonnement
              </a>
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              Artisanat Cases — Atelier de poterie<br />
              Pour toute question : manon@artisanatcases.fr
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#faf7f2", fontFamily: "'Georgia', 'Times New Roman', serif" };
const container = { maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "8px", overflow: "hidden" };
const header = { backgroundColor: "#b5552a", padding: "32px 40px", textAlign: "center" as const };
const logo = { color: "#ffffff", fontSize: "28px", margin: "0", fontWeight: "400", letterSpacing: "2px" };
const tagline = { color: "#f5dece", fontSize: "13px", margin: "4px 0 0", letterSpacing: "3px", textTransform: "uppercase" as const };
const content = { padding: "40px" };
const h2 = { color: "#3d2314", fontSize: "22px", fontWeight: "600", marginBottom: "8px" };
const text = { color: "#5c3d2e", fontSize: "15px", lineHeight: "24px" };
const warningBox = { backgroundColor: "#fff9f0", border: "1px solid #f0d9c0", borderRadius: "6px", padding: "16px", margin: "16px 0" };
const warningText = { color: "#7a4f2e", fontSize: "13px", lineHeight: "20px", margin: "0" };
const button = { backgroundColor: "#b5552a", color: "#ffffff", padding: "14px 28px", borderRadius: "6px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block", marginTop: "8px" };
const footer = { backgroundColor: "#faf7f2", padding: "24px 40px", borderTop: "1px solid #e8d5c4" };
const footerText = { color: "#9a6b50", fontSize: "12px", textAlign: "center" as const, lineHeight: "20px" };
