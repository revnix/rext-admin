import { Button } from "../ui/button";

export function TopicsSection({
  instruction,
  topics,
  onSelect,
}: {
  instruction: string;
  topics: string[];
  onSelect: (kw: string) => void;
}) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold my-4">{instruction}</h2>
      <div className="flex flex-wrap gap-2">
        {topics.map((kw) => (
          <Button
            key={kw}
            variant="outline"
            onClick={() => onSelect(kw)}
            className="bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-all ease-in-out duration-300"
          >
            <strong>{kw}</strong>
          </Button>
        ))}
      </div>
    </div>
  );
}
