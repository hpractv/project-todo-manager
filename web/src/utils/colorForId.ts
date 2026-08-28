const PALETTE = [
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#007AFF',
  '#5856D6',
  '#AF52DE',
  '#FF2D55',
];

export function colorForId(id: number): string {
  const index = ((id % PALETTE.length) + PALETTE.length) % PALETTE.length;
  return PALETTE[index];
}
