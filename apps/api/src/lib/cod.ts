export function codDecision(lines: { name: string; codAllowed: boolean }[]) {
  const blocked = lines.filter((line) => !line.codAllowed).map((line) => line.name);
  return {
    allowed: blocked.length === 0,
    blocked,
    message:
      blocked.length === 0
        ? null
        : `Cash on delivery is not available for ${blocked.join(", ")}. This order needs to be paid online.`,
  };
}
