export default function RatingStars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return '★';
    if (i === full && half) return '☆';
    return '☆';
  });
  return <div className="text-yellow-500">{stars.join(' ')}</div>;
}
