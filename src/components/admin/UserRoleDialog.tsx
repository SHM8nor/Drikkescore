import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Stack,
} from '@mui/material';
import type { UserRole } from '../../types/database';
import type { AdminUser } from '../../api/adminUsers';
import { useUserRoleManagement } from '../../hooks/useUserRoleManagement';

interface UserRoleDialogProps {
  open: boolean;
  user: AdminUser | null;
  currentUserId: string | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Dialog for managing user roles
 * Features:
 * - Shows both display_name and full_name for admin visibility
 * - Radio buttons for role selection (user/admin)
 * - Confirmation message for role changes
 * - Loading and error states
 * - Prevents changing own role
 */
export default function UserRoleDialog({
  open,
  user,
  currentUserId,
  onClose,
  onSuccess,
  onError,
}: UserRoleDialogProps) {
  const { updateRole, isUpdating, error } = useUserRoleManagement();
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [localError, setLocalError] = useState<string | null>(null);

  // Initialize selected role when user changes
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      setLocalError(null);
    }
  }, [user]);

  // Clear local error when dialog opens
  useEffect(() => {
    if (open) {
      setLocalError(null);
    }
  }, [open]);

  const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRole(event.target.value as UserRole);
    setLocalError(null);
  };

  const handleSave = async () => {
    if (!user) return;

    // Prevent changing own role
    if (user.id === currentUserId) {
      setLocalError('Du kan ikke endre din egen rolle');
      return;
    }

    // No change needed
    if (selectedRole === user.role) {
      onClose();
      return;
    }

    try {
      await updateRole(user.id, selectedRole);
      const roleText = selectedRole === 'admin' ? 'Administrator' : 'Bruker';
      onSuccess(`${user.display_name} er nå satt til rollen: ${roleText}`);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ukjent feil oppstod';
      onError(`Kunne ikke oppdatere rolle: ${errorMessage}`);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  const isOwnUser = user?.id === currentUserId;
  const hasRoleChanged = user && selectedRole !== user.role;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Endre brukerrolle</DialogTitle>
      <DialogContent>
        {user && (
          <Box>
            {/* User Info */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3, mt: 1 }}>
              <Avatar
                src={user.avatar_url || undefined}
                alt={user.display_name}
                sx={{ width: 56, height: 56 }}
              >
                {user.display_name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{user.display_name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.full_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.id}
                </Typography>
              </Box>
            </Stack>

            {/* Warning for own user */}
            {isOwnUser && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Du kan ikke endre din egen rolle
              </Alert>
            )}

            {/* Error display */}
            {(localError || error) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {localError || error?.message}
              </Alert>
            )}

            {/* Role selection */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Velg rolle:
            </Typography>
            <RadioGroup value={selectedRole} onChange={handleRoleChange}>
              <FormControlLabel
                value="user"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">Bruker</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Standard bruker med normal tilgang
                    </Typography>
                  </Box>
                }
                disabled={isOwnUser}
              />
              <FormControlLabel
                value="admin"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">Administrator</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Full tilgang til administrasjonspanel
                    </Typography>
                  </Box>
                }
                disabled={isOwnUser}
              />
            </RadioGroup>

            {/* Confirmation message */}
            {hasRoleChanged && !isOwnUser && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {selectedRole === 'admin'
                  ? `${user.display_name} vil få full tilgang til administrasjonspanelet.`
                  : `${user.display_name} vil miste tilgang til administrasjonspanelet.`}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isUpdating}>
          Avbryt
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isUpdating || isOwnUser || !hasRoleChanged}
          startIcon={isUpdating ? <CircularProgress size={16} /> : null}
        >
          {isUpdating ? 'Lagrer...' : 'Lagre'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
