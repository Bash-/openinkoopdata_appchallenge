import { TenderTable } from "@/lib/types";
import { HeartIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Card } from "../card";

export default function SearchResultCard({
  tender
}: {
  tender: TenderTable
}) {
  return (
    <Card key={tender.id} className="relative group overflow-hidden">
      <HeartIcon width={20} height={20} style={{ position: 'absolute', right: 4, top: 4, color: 'red' }} className="z-11" />
      <Link className="absolute inset-0 z-10" href={`/tenders/${tender.id}`}>
        <span className="sr-only">Bekijk tender</span>
      </Link>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{tender.title}</h3>
        <p>{tender.summary}</p>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Geplaatst: 2023-04-15</span>
          <span>Sluit: 2023-04-15</span>
          {/* <span className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400 px-2 py-1 rounded-full">
            Construction
          </span> */}
        </div>
        <p>Geplaatst door: {tender.business_name}</p>
      </div>
    </Card>
  )
}