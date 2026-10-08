/** A whole-page navigation, apart from the code that asks for one so that code can be tested. */
export function goTo(url: string): void {
  window.location.href = url;
}
