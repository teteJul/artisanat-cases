import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";

interface SubscriptionConfirmationEmailProps {
  clientName: string;
  planName: string;
  totalCourses: number;
  startDate: string;
  endDate: string;
  price: string;
  appUrl: string;
}

export default function SubscriptionConfirmationEmail({
  clientName,
  planName,
  totalCourses,
  startDate,
  endDate,
  price,
  appUrl,
}: SubscriptionConfirmationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre abonnement {planName} est activé !</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Artisanat Cases</Heading>
            <Text style={tagline}>Atelier de poterie</Text>
          </Section>
          <Section style={content}>
            <Heading as="h2" style={h2}>Votre abonnement est activé !</Heading>
            <Text style={text}>Bonjour {clientName},</Text>
            <Text style={text}>
              Merci pour votre confiance. Votre abonnement <strong>{planName}</strong> est maintenant actif.
            </Text>
            <Section style={card}>
              <Text style={cardLabel}>Formule</Text>
              <Text style={cardValue}>{planName}</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>Cours inclus</Text>
              <Text style={cardValue}>{totalCourses} cours</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>Valable du</Text>
              <Text style={cardValue}>{startDate} au {endDate}</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>Montant réglé</Text>
              <Text style={cardValue}>{price}</Text>
            </Section>
            <Section style={infoBox}>
              <Text style={infoText}>
                📅 <strong>Comment utiliser vos cours ?</strong> Lors de votre prochaine réservation, sélectionnez "Abonnement" comme mode de paiement. Vos crédits seront automatiquement déduits.
              </Text>
            </Section>
            <Button style={button} href={`${appUrl}/mon-espace/carnets`}>
              Voir mon abonnement
            </Button>
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
const card = { backgroundColor: "#fdf8f3", border: "1px solid #e8d5c4", borderRadius: "8px", padding: "24px", margin: "24px 0" };
const cardLabel = { color: "#9a6b50", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "1px", margin: "0 0 4px" };
const cardValue = { color: "#3d2314", fontSize: "15px", fontWeight: "600", margin: "0 0 16px" };
const divider = { borderColor: "#e8d5c4", margin: "16px 0" };
const infoBox = { backgroundColor: "#fff9f0", border: "1px solid #f0d9c0", borderRadius: "6px", padding: "16px", margin: "16px 0" };
const infoText = { color: "#7a4f2e", fontSize: "13px", lineHeight: "20px", margin: "0" };
const button = { backgroundColor: "#b5552a", color: "#ffffff", padding: "14px 28px", borderRadius: "6px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block", marginTop: "8px" };
const footer = { backgroundColor: "#faf7f2", padding: "24px 40px", borderTop: "1px solid #e8d5c4" };
const footerText = { color: "#9a6b50", fontSize: "12px", textAlign: "center" as const, lineHeight: "20px" };
