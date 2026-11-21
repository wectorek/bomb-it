export const TEAMS = [
  { id: 0, label: "Drużyna A", short: "A", color: "#f0b429" },
  { id: 1, label: "Drużyna B", short: "B", color: "#14b8a6" },
];

export function teamById(id) {
  return TEAMS.find((team) => team.id === id) ?? null;
}

export function teamForSeat(index) {
  return index % 2 === 0 ? TEAMS[0] : TEAMS[1];
}
