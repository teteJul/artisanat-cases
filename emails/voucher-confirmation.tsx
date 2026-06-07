import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";

interface VoucherConfirmationEmailProps {
  purchaserName: string;
  serviceName: string;
  code: string;
  expiresAt: string;
  appUrl: string;
  recipientEmail?: string;
}

export default function VoucherConfirmationEmail({
  purchaserName,
  serviceName,
  code,
  expiresAt,
  appUrl,
}: VoucherConfirmationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre bon cadeau Artisanat Cases — Code : {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Artisanat Cases</Heading>
            <Text style={tagline}>Atelier de poterie</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={h2}>🎁 Votre bon cadeau est prêt !</Heading>
            <Text style={text}>Bonjour {purchaserName},</Text>
            <Text style={text}>
              Merci pour votre achat ! Voici votre bon cadeau pour un <strong>{serviceName}</strong>.
            </Text>

            <Section style={codeBox}>
              <Text style={codeLabel}>Votre code unique</Text>
              <Text style={codeValue}>{code}</Text>
              <Text style={codeHint}>Valable jusqu'au {expiresAt}</Text>
            </Section>

            <Hr style={divider} />

            <Text style={text}>
              Le bénéficiaire peut utiliser ce code en créant un compte sur le site, puis en saisissant le code dans son espace personnel pour réserver son cours.
            </Text>

            <Button style={button} href={`${appUrl}/inscription`}>
              Créer un compte et utiliser le bon
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

const main = { backgroundColor: "#faf7f2", fontFamily: "'Georgia', 'Times New Roman', serif" };
const container = { maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "8px", overflow: "hidden" };
const header = { backgroundColor: "#b5552a", padding: "32px 40px", textAlign: "center" as const };
const logo = { color: "#ffffff", fontSize: "28px", margin: "0", fontWeight: "400", letterSpacing: "2px" };
const tagline = { color: "#f5dece", fontSize: "13px", margin: "4px 0 0", letterSpacing: "3px", textTransform: "uppercase" as const };
const content = { padding: "40px" };
const h2 = { color: "#3d2314", fontSize: "22px", fontWeight: "600", marginBottom: "8px" };
const text = { color: "#5c3d2e", fontSize: "15px", lineHeight: "24px" };
const codeBox = { backgroundColor: "#fdf3e7", border: "2px dashed #b5552a", borderRadius: "12px", padding: "24px", margin: "24px 0", textAlign: "center" as const };
const codeLabel = { color: "#9a6b50", fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "1px", margin: "0 0 8px" };
const codeValue = { color: "#b5552a", fontSize: "32px", fontWeight: "700", fontFamily: "monospace", letterSpacing: "4px", margin: "0 0 8px" };
const codeHint = { color: "#9a6b50", fontSize: "12px", margin: "0" };
const divider = { borderColor: "#e8d5c4", margin: "24px 0" };
const button = { backgroundColor: "#b5552a", color: "#ffffff", padding: "14px 28px", borderRadius: "6px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block", marginTop: "8px" };
const footer = { backgroundColor: "#faf7f2", padding: "24px 40px", borderTop: "1px solid #e8d5c4" };
const footerText = { color: "#9a6b50", fontSize: "12px", textAlign: "center" as const, lineHeight: "20px" };
