import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { brandCore } from '@/theme/tokens';
import { UpdateProfileForm } from '@/features/users/UpdateProfileForm';

const { color } = brandCore;

type ProfileDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * "Meus dados" em diálogo, aberto pelo bloco do usuário no header.
 *
 * O `UpdateProfileForm` é dono do próprio estado assíncrono (carga do perfil e
 * salvamento); aqui só ficam a moldura e o fechamento. O conteúdo desmonta ao
 * fechar, então cada abertura recarrega o perfil da API.
 */
export function ProfileDialog({ open, onClose }: ProfileDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="profile-dialog-title"
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            border: `1px solid ${color.borderNavy}`,
            backgroundImage: 'none',
          },
        },
      }}
    >
      <DialogTitle
        id="profile-dialog-title"
        component="div"
        sx={{
          borderBottom: `1px solid ${color.borderNavy}`,
          px: 3,
          py: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <ManageAccountsOutlinedIcon color="primary" />
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography variant="h6" component="h2">
                Meus dados
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Atualize suas informações pessoais e sua senha.
              </Typography>
            </Stack>
          </Stack>

          <IconButton
            onClick={onClose}
            aria-label="Fechar"
            size="small"
            sx={{ color: 'text.secondary', flexShrink: 0 }}
          >
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 3 }}>
        <UpdateProfileForm />
      </DialogContent>
    </Dialog>
  );
}
