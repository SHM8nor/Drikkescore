import { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Alert,
  Collapse,
  Button,
} from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import type { BadgeCriteria } from '../../types/badges';

// ============================================================================
// TYPES
// ============================================================================

interface BadgeCriteriaEditorProps {
  value: BadgeCriteria;
  onChange: (criteria: BadgeCriteria) => void;
  error?: string;
}

// ============================================================================
// EXAMPLE TEMPLATE
// ============================================================================

const EXAMPLE_TEMPLATE: BadgeCriteria = {
  type: 'threshold',
  conditions: [
    {
      metric: 'total_drinks',
      operator: '>=',
      value: 10,
      timeframe: 'session',
    },
  ],
  requireAll: true,
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * BadgeCriteriaEditor Component
 *
 * Simple JSON editor for badge criteria with validation.
 * Shows example template and validates JSON structure.
 */
export default function BadgeCriteriaEditor({
  value,
  onChange,
  error,
}: BadgeCriteriaEditorProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [showHelp, setShowHelp] = useState(false);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(value, null, 2));
  const [validationError, setValidationError] = useState<string | null>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleJsonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newText = event.target.value;
    setJsonText(newText);
    setValidationError(null);

    // Try to parse JSON
    try {
      const parsed = JSON.parse(newText);

      // Validate structure
      if (!parsed.type) {
        setValidationError('Mangler "type" felt');
        return;
      }

      if (!Array.isArray(parsed.conditions)) {
        setValidationError('"conditions" må være en array');
        return;
      }

      // Validate each condition
      for (let i = 0; i < parsed.conditions.length; i++) {
        const condition = parsed.conditions[i];
        if (!condition.metric) {
          setValidationError(`Betingelse ${i + 1}: Mangler "metric"`);
          return;
        }
        if (!condition.operator) {
          setValidationError(`Betingelse ${i + 1}: Mangler "operator"`);
          return;
        }
        if (condition.value === undefined) {
          setValidationError(`Betingelse ${i + 1}: Mangler "value"`);
          return;
        }
      }

      // Valid - notify parent
      onChange(parsed as BadgeCriteria);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setValidationError('Ugyldig JSON-format');
      }
    }
  };

  const handleUseExample = () => {
    const exampleJson = JSON.stringify(EXAMPLE_TEMPLATE, null, 2);
    setJsonText(exampleJson);
    onChange(EXAMPLE_TEMPLATE);
    setValidationError(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box>
      {/* Help Toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button
          size="small"
          startIcon={<HelpIcon />}
          onClick={() => setShowHelp(!showHelp)}
        >
          {showHelp ? 'Skjul hjelp' : 'Vis hjelp'}
        </Button>
        <Button size="small" variant="outlined" onClick={handleUseExample}>
          Bruk eksempel
        </Button>
      </Box>

      {/* Help Section */}
      <Collapse in={showHelp}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Kriterieformat:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <strong>type:</strong> &apos;threshold&apos; | &apos;milestone&apos; | &apos;streak&apos; | &apos;combination&apos;
              </li>
              <li>
                <strong>conditions:</strong> Array av betingelser
              </li>
              <li>
                <strong>requireAll:</strong> true (alle betingelser må oppfylles) eller false (minst
                én)
              </li>
            </ul>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }} gutterBottom>
            <strong>Betingelsesformat:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <strong>metric:</strong> &apos;total_drinks&apos;, &apos;max_bac&apos;, &apos;session_count&apos;, osv.
              </li>
              <li>
                <strong>operator:</strong> &apos;&gt;=&apos;, &apos;==&apos;, &apos;&lt;=&apos;, &apos;&gt;&apos;, &apos;&lt;&apos;, &apos;between&apos;
              </li>
              <li>
                <strong>value:</strong> tall eller [min, max] for &apos;between&apos;
              </li>
              <li>
                <strong>timeframe:</strong> &apos;session&apos;, &apos;all_time&apos;, &apos;30_days&apos;, &apos;7_days&apos;, &apos;24_hours&apos;
              </li>
            </ul>
          </Typography>
        </Alert>
      </Collapse>

      {/* JSON Editor */}
      <TextField
        fullWidth
        multiline
        rows={12}
        value={jsonText}
        onChange={handleJsonChange}
        error={Boolean(validationError || error)}
        helperText={validationError || error || 'JSON-format for merkekriteria'}
        label="Kriteria (JSON)"
        sx={{
          '& .MuiInputBase-input': {
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          },
        }}
      />

      {/* Example Template Display */}
      {!showHelp && jsonText.trim() === '' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Eksempel:
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
            }}
          >
            {JSON.stringify(EXAMPLE_TEMPLATE, null, 2)}
          </Box>
        </Box>
      )}
    </Box>
  );
}
