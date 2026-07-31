import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";

export function CountingToggle({
  counting,
  isCompleted,
  disabled,
  onToggle,
}: {
  counting: boolean;
  isCompleted: boolean;
  disabled: boolean;
  onToggle: () => Promise<void>;
}) {
  return (
    <Tooltip title={isCompleted ? "Reopen the round to change this" : ""}>
      <span>
        <FormControlLabel
          sx={{ mb: 2 }}
          control={
            <Switch
              checked={counting}
              disabled={disabled || isCompleted}
              onChange={() => void onToggle()}
            />
          }
          label="Counting round"
        />
      </span>
    </Tooltip>
  );
}
