import { Typography, Box, Link } from "@mui/material";

interface PrivacyPolicyTextProps {
  variant?: "full" | "compact";
}

/**
 * PrivacyPolicyText Component
 *
 * Displays the app's privacy policy in Norwegian.
 *
 * Props:
 * - variant: 'full' (default) shows complete text with spacing
 *           'compact' shows condensed version for settings page
 */
export default function PrivacyPolicyText({
  variant = "full",
}: PrivacyPolicyTextProps) {
  const isCompact = variant === "compact";

  return (
    <Box>
      <Typography
        variant={isCompact ? "h6" : "h5"}
        component="h2"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: "var(--prussian-blue)",
          mb: isCompact ? 1 : 2,
        }}
      >
        🔒 Personvern (kort, hyggelig og tydelig)
      </Typography>

      <Typography variant="body1" paragraph sx={{ mb: isCompact ? 1 : 2 }}>
        Vi liker ikke snoking.
        <br />
        Appen lagrer bare det du selv skriver inn — drikke, tidspunkt, og
        kanskje et kallenavn hvis du er kreativ.
      </Typography>

      <Typography variant="body1" paragraph sx={{ mb: isCompact ? 1 : 2 }}>
        Vi selger ikke, deler ikke og spionerer ikke på deg. Dataene brukes kun
        for å vise deg din egen promille (og kanskje gi deg litt ettertanke).
      </Typography>

      <Typography variant="body1" paragraph sx={{ mb: isCompact ? 1 : 2 }}>
        Du kan når som helst slette alle dataene dine fra Innstillinger-siden —
        uten drama.
      </Typography>

      <Typography variant="body1" paragraph sx={{ mb: isCompact ? 1 : 2 }}>
        All data lagres trygt i Supabase (sikker skylagring) med
        tilgangskontroll og passord.
      </Typography>

      <Typography
        variant="body1"
        paragraph
        sx={{ mb: isCompact ? 1 : 2, fontWeight: 500 }}
      >
        Hva lagrer vi egentlig?
      </Typography>

      <Typography
        variant="body1"
        component="div"
        sx={{ mb: isCompact ? 1 : 2, pl: 2 }}
      >
        • Navn, vekt, høyde, kjønn og alder (for å regne ut promille, ikke for
        dating-profil) 📊
        <br />
        • Hva du drikker, når du drikker det, og hvor mye (ditt private
        drikkekart) 🍺
        <br />
        • Øktnavn og -koder (f.eks. "Fredag med gutta 2.0") 🎉
        <br />
        • Vennelister (vi husker hvem du fester med) 👥
        <br />
        • Profilbilde hvis du laster opp et (valgfritt, men vi liker ansikter)
        📸
        <br />• Når du er aktiv i en økt (sånn at vennene dine kan stalke
        promillen din i sanntid) 👀
      </Typography>

      <Typography variant="body1" paragraph sx={{ mb: isCompact ? 1 : 2 }}>
        Vi samler IKKE inn sensitiv info som:
        <br />
        Blodtype, personnummer, adresse, bankinfo, kjærlighetssorg, ekser eller
        hemmelige taco-oppskrifter. 🌮
      </Typography>

      <Typography variant="body1" sx={{ mb: 0 }}>
        Spørsmål eller ønske om manuell sletting? Send en e-post til{" "}
        <Link
          href="mailto:jakobhofstad@gmail.com"
          sx={{
            color: "var(--orange-wheel)",
            fontWeight: 500,
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
              color: "var(--orange-wheel-dark)",
            },
          }}
        >
          jakobhofstad@gmail.com
        </Link>
      </Typography>
    </Box>
  );
}
