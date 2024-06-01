/**

 */
import Pagination from "@/components/ui/search/pagination";
import Search from "@/components/ui/search/search";
import SearchResults from "@/components/ui/search/search-results";
import { TendersSkeleton } from "@/components/ui/search/search-skeleton";
import { fetchTendersPages } from "@/lib/data";

import { Suspense } from "react";


export default async function SearchPage({
  searchParams
}: {
  searchParams?: {
    q?: string;
    min_date?: string;
    max_date?: string;
    category?: string;
    page?: string;
  };
}) {
  const { q: searchValue, min_date, max_date, category, page } = searchParams as { [key: string]: string };
  const currentPage = Number(page ?? 1) || 1;

  const totalPages = await fetchTendersPages(searchValue, min_date, max_date);

  return (
    <main className="container mx-auto">
      <Search />
      <Suspense key={searchValue + currentPage} fallback={<TendersSkeleton />}>
        <SearchResults q={searchValue} min_date={min_date} max_date={max_date} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>

    </main >
  )
}