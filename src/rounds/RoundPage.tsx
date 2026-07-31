import { useState } from "react";
import { useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import { chunk, HOLES_PER_GROUP } from "../shared/chunk";
import { CheckpointStepView } from "./CheckpointStepView";
import { CountingToggle } from "./CountingToggle";
import { FinalStepView } from "./FinalStepView";
import { HoleStepView } from "./HoleStepView";
import { PlayerRosterPanel } from "./PlayerRosterPanel";
import { RoundHeader } from "./RoundHeader";
import { RoundStepHeader } from "./RoundStepHeader";
import { buildSteps } from "./steps";
import { useRoundData } from "./useRoundData";

export function RoundPage() {
  const { roundId } = useParams();
  const id = Number(roundId);
  const data = useRoundData(id);
  const [stepIndex, setStepIndex] = useState(0);

  if (data.status === "loading") {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (data.status === "error" || !data.round) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{data.error}</Alert>
      </Container>
    );
  }

  const { round } = data;
  const isCompleted = round.completedAt !== null;
  const coursePar = round.holes.reduce((sum, h) => sum + h.par, 0);
  const holeGroups = chunk(round.holes, HOLES_PER_GROUP);
  const scoreByKey = new Map(
    round.scores.map((score) => [`${score.holeId}:${score.playerId}`, score]),
  );

  const steps = buildSteps(holeGroups);
  const step = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const goToPrevious = () => setStepIndex((index) => Math.max(0, index - 1));
  const goToNext = () =>
    setStepIndex((index) => Math.min(steps.length - 1, index + 1));

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <RoundHeader
        round={round}
        isCompleted={isCompleted}
        finishing={data.finishing}
        reopening={data.reopening}
        onFinish={data.handleFinish}
        onReopen={data.handleReopen}
      />

      <CountingToggle
        counting={round.counting}
        isCompleted={isCompleted}
        disabled={data.togglingCounting}
        onToggle={data.handleToggleCounting}
      />

      <PlayerRosterPanel
        round={round}
        isCompleted={isCompleted}
        onRoundUpdated={data.setRound}
        onError={data.setError}
      />

      <RoundStepHeader
        step={step}
        holeGroups={holeGroups}
        coursePar={coursePar}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onPrevious={goToPrevious}
        onNext={goToNext}
      />

      {step.kind === "checkpoint" ? (
        <CheckpointStepView
          players={round.players}
          scores={round.scores}
          holeGroups={holeGroups}
          groupIndex={step.groupIndex}
          scoreByKey={scoreByKey}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      ) : step.kind === "final" ? (
        <FinalStepView
          players={round.players}
          scores={round.scores}
          holeGroups={holeGroups}
          scoreByKey={scoreByKey}
        />
      ) : (
        <HoleStepView
          hole={step.hole}
          players={round.players}
          scores={round.scores}
          isCompleted={isCompleted}
          setScore={data.setScore}
          adjust={data.adjust}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      )}

      {data.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {data.error}
        </Alert>
      )}
    </Container>
  );
}
