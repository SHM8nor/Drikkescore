import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useDrinkPrices } from '../../hooks/useDrinkPrices';
import type { DrinkPriceFormData, DrinkPrice } from '../../types/analytics';

/**
 * DrinkPriceManager Component
 *
 * Allows users to manage their drink prices for spending analytics.
 * Features:
 * - Add new drink prices
 * - Edit existing prices
 * - Delete prices
 * - Mark a price as default
 * - Form validation
 */
export default function DrinkPriceManager() {
  const { prices, loading, error, addPrice, updatePrice, deletePrice } = useDrinkPrices();

  const [formData, setFormData] = useState<DrinkPriceFormData>({
    drink_name: '',
    price_amount: 0,
    currency: 'NOK',
    volume_ml: undefined,
    alcohol_percentage: undefined,
    is_default: false,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<DrinkPriceFormData | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form data
  const validateForm = (data: DrinkPriceFormData): boolean => {
    const errors: Record<string, string> = {};

    if (!data.drink_name.trim()) {
      errors.drink_name = 'Drikkenavn er påkrevd';
    }

    if (data.price_amount <= 0) {
      errors.price_amount = 'Pris må være større enn 0';
    }

    if (data.volume_ml !== undefined && data.volume_ml <= 0) {
      errors.volume_ml = 'Volum må være større enn 0';
    }

    if (data.alcohol_percentage !== undefined) {
      if (data.alcohol_percentage < 0 || data.alcohol_percentage > 100) {
        errors.alcohol_percentage = 'Alkoholprosent må være mellom 0 og 100';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle add new price
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(formData)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await addPrice(formData);

      // Reset form
      setFormData({
        drink_name: '',
        price_amount: 0,
        currency: 'NOK',
        volume_ml: undefined,
        alcohol_percentage: undefined,
        is_default: false,
      });
      setFormErrors({});
    } catch (err) {
      console.error('Error adding price:', err);
      setSubmitError(err instanceof Error ? err.message : 'Kunne ikke legge til pris');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing a price
  const handleEditStart = (price: DrinkPrice) => {
    setEditingId(price.id);
    setEditFormData({
      drink_name: price.drink_name,
      price_amount: price.price_amount,
      currency: price.currency,
      volume_ml: price.volume_ml || undefined,
      alcohol_percentage: price.alcohol_percentage || undefined,
      is_default: price.is_default,
    });
    setFormErrors({});
  };

  // Save edited price
  const handleEditSave = async (id: string) => {
    if (!editFormData || !validateForm(editFormData)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updatePrice(id, editFormData);
      setEditingId(null);
      setEditFormData(null);
      setFormErrors({});
    } catch (err) {
      console.error('Error updating price:', err);
      setSubmitError(err instanceof Error ? err.message : 'Kunne ikke oppdatere pris');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData(null);
    setFormErrors({});
  };

  // Delete a price
  const handleDelete = async (id: string) => {
    if (!window.confirm('Er du sikker på at du vil slette denne prisen?')) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await deletePrice(id);
    } catch (err) {
      console.error('Error deleting price:', err);
      setSubmitError(err instanceof Error ? err.message : 'Kunne ikke slette pris');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Feil ved lasting av priser: {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Add New Price Form */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Legg til ny pris
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="Drikkenavn"
            value={formData.drink_name}
            onChange={(e) => setFormData({ ...formData, drink_name: e.target.value })}
            error={!!formErrors.drink_name}
            helperText={formErrors.drink_name}
            margin="normal"
            required
            placeholder="F.eks. Øl, Vin, Drink"
          />

          <Box display="flex" gap={2} sx={{ mt: 1 }}>
            <TextField
              label="Pris"
              type="number"
              value={formData.price_amount || ''}
              onChange={(e) => setFormData({ ...formData, price_amount: parseFloat(e.target.value) || 0 })}
              error={!!formErrors.price_amount}
              helperText={formErrors.price_amount}
              margin="normal"
              required
              InputProps={{
                endAdornment: <InputAdornment position="end">kr</InputAdornment>,
              }}
              sx={{ flex: 1 }}
            />

            <TextField
              label="Volum (ml)"
              type="number"
              value={formData.volume_ml || ''}
              onChange={(e) => setFormData({ ...formData, volume_ml: e.target.value ? parseInt(e.target.value) : undefined })}
              error={!!formErrors.volume_ml}
              helperText={formErrors.volume_ml || 'Valgfritt'}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">ml</InputAdornment>,
              }}
              sx={{ flex: 1 }}
            />

            <TextField
              label="Alkohol %"
              type="number"
              value={formData.alcohol_percentage || ''}
              onChange={(e) => setFormData({ ...formData, alcohol_percentage: e.target.value ? parseFloat(e.target.value) : undefined })}
              error={!!formErrors.alcohol_percentage}
              helperText={formErrors.alcohol_percentage || 'Valgfritt'}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              sx={{ flex: 1 }}
            />
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              />
            }
            label="Sett som standardpris"
            sx={{ mt: 2 }}
          />

          <Box sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
            >
              Legg til pris
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Error Display */}
      {submitError && (
        <Alert severity="error" onClose={() => setSubmitError(null)} sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      {/* Saved Prices List */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Lagrede priser ({prices.length})
        </Typography>

        {prices.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            Ingen priser lagt til ennå. Legg til en pris for å spore utgifter!
          </Typography>
        ) : (
          <List>
            {prices.map((price, index) => (
              <Box key={price.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    editingId === price.id ? (
                      <Box>
                        <IconButton
                          edge="end"
                          onClick={() => handleEditSave(price.id)}
                          disabled={isSubmitting}
                          color="primary"
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={handleEditCancel}
                          disabled={isSubmitting}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box>
                        <IconButton
                          edge="end"
                          onClick={() => handleEditStart(price)}
                          disabled={isSubmitting}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDelete(price.id)}
                          disabled={isSubmitting}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )
                  }
                  sx={{ alignItems: 'flex-start' }}
                >
                  {editingId === price.id && editFormData ? (
                    <Box sx={{ flex: 1, mr: 2 }}>
                      <TextField
                        fullWidth
                        label="Drikkenavn"
                        value={editFormData.drink_name}
                        onChange={(e) => setEditFormData({ ...editFormData, drink_name: e.target.value })}
                        error={!!formErrors.drink_name}
                        helperText={formErrors.drink_name}
                        margin="dense"
                        size="small"
                      />
                      <Box display="flex" gap={1} sx={{ mt: 1 }}>
                        <TextField
                          label="Pris"
                          type="number"
                          value={editFormData.price_amount || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, price_amount: parseFloat(e.target.value) || 0 })}
                          error={!!formErrors.price_amount}
                          helperText={formErrors.price_amount}
                          margin="dense"
                          size="small"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">kr</InputAdornment>,
                          }}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          label="Volum"
                          type="number"
                          value={editFormData.volume_ml || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, volume_ml: e.target.value ? parseInt(e.target.value) : undefined })}
                          margin="dense"
                          size="small"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">ml</InputAdornment>,
                          }}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          label="Alkohol %"
                          type="number"
                          value={editFormData.alcohol_percentage || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, alcohol_percentage: e.target.value ? parseFloat(e.target.value) : undefined })}
                          margin="dense"
                          size="small"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editFormData.is_default}
                            onChange={(e) => setEditFormData({ ...editFormData, is_default: e.target.checked })}
                            size="small"
                          />
                        }
                        label="Standardpris"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  ) : (
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" component="span">
                            {price.drink_name}
                          </Typography>
                          {price.is_default && (
                            <Chip label="Standard" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span" color="primary" fontWeight="bold">
                            {price.price_amount.toFixed(2)} {price.currency}
                          </Typography>
                          {(price.volume_ml || price.alcohol_percentage) && (
                            <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 2 }}>
                              {price.volume_ml && `${price.volume_ml}ml`}
                              {price.volume_ml && price.alcohol_percentage && ' • '}
                              {price.alcohol_percentage && `${price.alcohol_percentage}%`}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  )}
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
