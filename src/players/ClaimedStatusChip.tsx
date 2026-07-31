import Chip from "@mui/material/Chip";

export function ClaimedStatusChip({
  claimedByUserId,
  currentUserId,
}: {
  claimedByUserId: number | null;
  currentUserId: number | undefined;
}) {
  const isMine = claimedByUserId === currentUserId;
  return (
    <Chip
      size="small"
      label={isMine ? "You" : claimedByUserId !== null ? "Claimed" : "Guest"}
      color={isMine ? "primary" : "default"}
      variant={isMine ? "filled" : "outlined"}
    />
  );
}
