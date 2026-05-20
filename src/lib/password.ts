export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) errors.push("8자 이상");
  if (!/[0-9]/.test(password)) errors.push("숫자 포함");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push("특수문자 포함");
  if (!/[a-zA-Z]/.test(password)) errors.push("영문자 포함");

  return { valid: errors.length === 0, errors };
}

export function passwordErrorMessage(password: string): string | null {
  const { valid, errors } = validatePassword(password);
  if (valid) return null;
  return `비밀번호 조건 미충족: ${errors.join(", ")}`;
}
