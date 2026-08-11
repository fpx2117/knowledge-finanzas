import { advanceWelcomeStepAction } from "../actions/advance-welcome-step";

export function WelcomeStepForm() {
  return (
    <form action={advanceWelcomeStepAction}>
      <button className="primary-button" type="submit">Comenzar</button>
    </form>
  );
}
