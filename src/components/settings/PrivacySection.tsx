import { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Policy as PolicyIcon } from '@mui/icons-material';
import DisclaimerText from '../legal/DisclaimerText';
import PrivacyPolicyText from '../legal/PrivacyPolicyText';

interface PrivacySectionProps {
  termsAcceptedAt?: string | null;
}

/**
 * PrivacySection Component
 *
 * Displays disclaimer and privacy policy in an expandable accordion.
 * Shows when user last accepted terms.
 *
 * Features:
 * - Two separate accordions for disclaimer and privacy policy
 * - Compact variant of legal text components
 * - Shows timestamp of when terms were accepted
 * - Matches settings-card styling
 */
export default function PrivacySection({ termsAcceptedAt }: PrivacySectionProps) {
  const [expandedDisclaimer, setExpandedDisclaimer] = useState(false);
  const [expandedPrivacy, setExpandedPrivacy] = useState(false);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Aldri';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('nb-NO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Ukjent dato';
    }
  };

  return (
    <div className="settings-card">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <PolicyIcon sx={{ color: '#003049' }} />
        <Typography
          variant="h5"
          component="h2"
          sx={{ color: '#003049', fontWeight: 600 }}
        >
          Personvern og vilkår
        </Typography>
      </Box>

      {termsAcceptedAt && (
        <Typography
          variant="body2"
          sx={{
            color: '#666',
            mb: 3,
            fontSize: '0.875rem',
          }}
        >
          Sist godkjent: {formatDate(termsAcceptedAt)}
        </Typography>
      )}

      {/* Disclaimer Accordion */}
      <Accordion
        expanded={expandedDisclaimer}
        onChange={() => setExpandedDisclaimer(!expandedDisclaimer)}
        sx={{
          mb: 1,
          boxShadow: 'none',
          border: '1px solid #e0e0e0',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 8px 0',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            backgroundColor: '#f5f5f5',
            '&:hover': {
              backgroundColor: '#eeeeee',
            },
            '& .MuiAccordionSummary-content': {
              margin: '12px 0',
            },
          }}
        >
          <Typography sx={{ fontWeight: 500, color: '#003049' }}>
            Ansvarsfraskrivelse
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3, backgroundColor: '#fff' }}>
          <DisclaimerText variant="compact" />
        </AccordionDetails>
      </Accordion>

      {/* Privacy Policy Accordion */}
      <Accordion
        expanded={expandedPrivacy}
        onChange={() => setExpandedPrivacy(!expandedPrivacy)}
        sx={{
          boxShadow: 'none',
          border: '1px solid #e0e0e0',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            backgroundColor: '#f5f5f5',
            '&:hover': {
              backgroundColor: '#eeeeee',
            },
            '& .MuiAccordionSummary-content': {
              margin: '12px 0',
            },
          }}
        >
          <Typography sx={{ fontWeight: 500, color: '#003049' }}>
            Personvernerklæring
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3, backgroundColor: '#fff' }}>
          <PrivacyPolicyText variant="compact" />
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
