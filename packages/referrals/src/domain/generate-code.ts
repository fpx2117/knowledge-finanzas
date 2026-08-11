// Excludes 0/O/1/I/L to avoid visual ambiguity. Not derived from any user PII (name, email, etc).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

export function generateReferralCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    const index = Math.floor(random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET[index];
  }
  return code;
}
