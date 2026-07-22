import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";

interface SubscriptionCancelledEmailProps {
  clientName: string;
  planName: string;
  remainingCredits: number;
  cancelledAt: string;
}

export default function SubscriptionCancelledEmail({
  clientName,
  planName,
  remainingCredits,
  cancelledAt,
}: SubscriptionCancelledEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre abonnement {planName} a été annulé</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Artisanat Cases</Heading>
            <Text style={tagline}>Atelier de poterie</Text>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={h2}>Abonnement annulé</Heading>
            <Text style={text}>Bonjour {clientName},</Text>
            <Text style={text}>
              Votre abonnement <strong>{planName}</strong> a été annulé le {cancelledAt}.
            </Text>
            {remainingCredits > 0 && (
              <Section style={infoBox}>
                <Text style={infoText}>
                  ℹ️ Il vous restait <strong>{remainingCredits} cours</strong> non utilisés. Pour toute question concernant un remboursement, contactez-nous à manon@artisanatcases.fr.
                </Text>
              </Section>
            )}
            <Text style={text}>
              Nous espérons vous retrouver prochainement à l'atelier !
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
const infoBox = { backgroundColor: "#fff9f0", border: "1px solid #f0d9c0", borderRadius: "6px", padding: "16px", margin: "16px 0" };
const infoText = { color: "#7a4f2e", fontSize: "13px", lineHeight: "20px", margin: "0" };
const footer = { backgroundColor: "#faf7f2", padding: "24px 40px", borderTop: "1px solid #e8d5c4" };
const footerText = { color: "#9a6b50", fontSize: "12px", textAlign: "center" as const, lineHeight: "20px" };
