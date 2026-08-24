import { Card } from "@/components/ui/Card";
import type { Car } from "@/lib/types";

export function GarageList({ cars }: { cars: Car[] }) {
  if (cars.length === 0) {
    return <p className="text-sm text-muted">No cars in the garage yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {cars.map((car) => (
        <Card key={car.id} className="overflow-hidden">
          <div className="aspect-square bg-surface-raised">
            {car.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={car.photo_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="p-2.5">
            <p className="truncate text-sm font-medium">
              {car.year ? `${car.year} ` : ""}
              {car.make} {car.model}
            </p>
            {car.notes && <p className="truncate text-xs text-muted">{car.notes}</p>}
          </div>
        </Card>
      ))}
    </div>
  );
}
