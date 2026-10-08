// What an account agrees to is the website's terms and policy. The app's own pages (/legal) are
// linked under the forms by PolicyLinks; which of the two an account agrees to is task 163's.
const TERMS_URL = "https://rext.ai/terms-and-conditions";
const PRIVACY_URL = "https://rext.ai/privacy-policy";

const LINK = "underline underline-offset-4 hover:text-foreground";

/**
 * What creating an account agrees to, shown before every way of creating one: the sign-up form,
 * and Google or GitHub on the login page, which create an account for a first-time user.
 */
export function LegalAgreement({ action }: { action: string }) {
  return (
    <p className="text-center text-caption text-muted-foreground">
      By {action}, you agree to the{" "}
      <a
        href={TERMS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK}
      >
        Terms<span className="sr-only"> (opens in a new tab)</span>
      </a>{" "}
      and the{" "}
      <a
        href={PRIVACY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK}
      >
        Privacy Policy<span className="sr-only"> (opens in a new tab)</span>
      </a>
      .
    </p>
  );
}
