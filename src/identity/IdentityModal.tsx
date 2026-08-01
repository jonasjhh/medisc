import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useIdentity } from "./IdentityContext";
import type { OnboardingStep } from "./IdentityContext";
import { createUser, linkDevice } from "./api";
import { claimPlayer, listPlayers } from "../players/api";
import type { Player } from "../players/api";

export function IdentityModal() {
  const { isOnboardingOpen, onboardingStep, closeOnboarding, applyUser, user } =
    useIdentity();
  const [step, setStep] = useState<OnboardingStep>(onboardingStep);
  const [showLinkField, setShowLinkField] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unclaimedPlayers, setUnclaimedPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  useEffect(() => {
    if (isOnboardingOpen) {
      setStep(onboardingStep);
      setShowLinkField(false);
      setCode("");
      setError(null);
      setSelectedPlayerId(null);
    }
  }, [isOnboardingOpen, onboardingStep]);

  useEffect(() => {
    if (!isOnboardingOpen || step !== "claim") return;
    listPlayers({ unclaimed: true })
      .then(({ players }) => setUnclaimedPlayers(players))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not load players"),
      );
  }, [isOnboardingOpen, step]);

  function afterResolved(resolvedUser: NonNullable<typeof user>) {
    applyUser(resolvedUser);
    if (resolvedUser.claimedPlayer === null) {
      setStep("claim");
    } else {
      closeOnboarding();
    }
  }

  async function handleGetStarted() {
    setBusy(true);
    setError(null);
    try {
      const { user: created } = await createUser();
      afterResolved(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleLinkSubmit() {
    setBusy(true);
    setError(null);
    try {
      const { user: linked } = await linkDevice(code);
      afterResolved(linked);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim() {
    if (selectedPlayerId === null) return;
    setBusy(true);
    setError(null);
    try {
      const claimed = await claimPlayer(selectedPlayerId);
      if (user) {
        applyUser({
          ...user,
          claimedPlayer: { id: claimed.id, name: claimed.name },
        });
      }
      closeOnboarding();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not claim that player");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={isOnboardingOpen}
      onClose={closeOnboarding}
      fullWidth
      maxWidth="xs"
    >
      {step === "welcome" && (
        <>
          <DialogTitle>Set up your profile</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              variant="contained"
              fullWidth
              disabled={busy}
              onClick={() => void handleGetStarted()}
            >
              Get Started
            </Button>
            <Button
              sx={{ mt: 2 }}
              size="small"
              onClick={() => setShowLinkField((v) => !v)}
            >
              I already have an account
            </Button>
            <Collapse in={showLinkField}>
              <TextField
                sx={{ mt: 1 }}
                fullWidth
                label="Link code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
              />
              <Button
                sx={{ mt: 1 }}
                fullWidth
                disabled={busy || code.length !== 8}
                onClick={() => void handleLinkSubmit()}
              >
                Link this device
              </Button>
            </Collapse>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeOnboarding}>Not now</Button>
          </DialogActions>
        </>
      )}
      {step === "claim" && (
        <>
          <DialogTitle>Is one of these you?</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {unclaimedPlayers.length === 0 ? (
              <Typography color="text.secondary">
                No unclaimed players to choose from yet.
              </Typography>
            ) : (
              <RadioGroup
                value={selectedPlayerId ?? ""}
                onChange={(event) =>
                  setSelectedPlayerId(Number(event.target.value))
                }
              >
                {unclaimedPlayers.map((player) => (
                  <FormControlLabel
                    key={player.id}
                    value={player.id}
                    control={<Radio />}
                    label={player.name}
                  />
                ))}
              </RadioGroup>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeOnboarding}>Skip</Button>
            <Button
              variant="contained"
              disabled={busy || selectedPlayerId === null}
              onClick={() => void handleClaim()}
            >
              Claim
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
