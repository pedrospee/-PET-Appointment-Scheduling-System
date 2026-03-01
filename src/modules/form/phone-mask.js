
// Removes all non-numeric characters from a string.
function onlyDigits(value) {
  return value.replace(/\D/g, "");
}


// Applies phone mask in format: (00)0 0000-0000
function applyPhoneMask(digits) {
  const d = digits.slice(0, 11);

  const part1 = d.slice(0, 2);
  const part2 = d.slice(2, 3);
  const part3 = d.slice(3, 7);
  const part4 = d.slice(7, 11);

  let result = "";

  if (part1) result += `(${part1}`;
  if (part1.length === 2) result += ")";
  if (part2) result += part2;
  if (part3) result += ` ${part3}`;
  if (part4) result += `-${part4}`;

  return result;
}

/**
 Sets up input masking for phone field.
 Ensures consistent formatting and prevents invalid characters.
 */
export function setupPhoneMask() {
  const input = document.querySelector("#phone");
  if (!input) return;

  if (input.dataset.maskBound === "true") return;
  input.dataset.maskBound = "true";

  input.addEventListener("input", (e) => {
    const digits = onlyDigits(e.target.value);
    e.target.value = applyPhoneMask(digits);
  });

  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    const digits = onlyDigits(pasted);
    input.value = applyPhoneMask(digits);
  });
}