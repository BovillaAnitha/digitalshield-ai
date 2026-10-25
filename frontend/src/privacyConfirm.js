
export function confirmEvidenceUpload() {
  return window.confirm(
    "PRIVACY WARNING\n\n" +
    "DigitalShield AI is currently a prototype.\n\n" +
    "Uploaded evidence may be stored locally without encryption " +
    "or authentication.\n\n" +
    "Do not upload real sensitive evidence until appropriate " +
    "security protections are implemented.\n\n" +
    "Continue with this test upload?"
  );
}
