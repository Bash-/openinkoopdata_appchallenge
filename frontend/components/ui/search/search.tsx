'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/search/calendar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DateRange } from "react-day-picker";
import { useDebounceCallback } from "usehooks-ts";

export default function Search({ }) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname()

  const handleSearch = useDebounceCallback((term: string) => {
    console.log(term);
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }

    replace(`${pathname}?${params.toString()}`);

  }, 300)

  const handleDateChanged = (dates: DateRange) => {

    const params = new URLSearchParams(searchParams);
    const urlFormatDate = (date: Date) => `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`

    if (dates?.from) {

      params.set('min_date', urlFormatDate(dates.from));
    } else {
      params.delete('min_date');
    }

    if (dates?.to) {
      params.set('max_date', urlFormatDate(dates.to));
    } else {
      params.delete('max_date');
    }

    replace(`${pathname}?${params.toString()}`);

  }


  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button className="flex items-center gap-2" variant="outline">
              <CalendarDaysIcon className="size-5" />
              <span>Filter by date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-4">
            <Calendar mode="range" numberOfMonths={1} onSelectRange={(dates) => handleDateChanged(dates)} />
          </PopoverContent>
        </Popover>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-500 dark:text-gray-400" />
          <Input
            defaultValue={searchParams?.get('q')?.toString()}
            onChange={(e) => {
              handleSearch(e.target.value);
            }}
            className="pl-10 pr-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            placeholder="Search tenders..."
            type="search"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="rounded-full" size="sm" variant="ghost">
          Construction
        </Button>
        <Button className="rounded-full" size="sm" variant="ghost">
          IT Services
        </Button>
        <Button className="rounded-full" size="sm" variant="ghost">
          Consulting
        </Button>
        <Button className="rounded-full" size="sm" variant="ghost">
          Logistics
        </Button>
      </div>
    </div>
  )

}

function CalendarDaysIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  )
}


function SearchIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}