import { sql } from '@vercel/postgres';

import { tenders } from './dummy-data';
import {
  TenderForm,
  TendersTable,
} from './types';

const datefilter = (min_date: Date, max_date: Date) => {
  return `${min_date && max_date ? `AND date BETWEEN ${min_date} AND ${max_date}` : ''}
  ${min_date && !max_date ? `AND date >= ${min_date}` : ''}
  ${!min_date && max_date ? `AND date <= ${min_date}` : ''}`
}


const ITEMS_PER_PAGE = 6;
export async function fetchFilteredTenders(
  query: string,
  min_date: Date,
  max_date: Date,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const tenders = await sql<TendersTable>`
      SELECT
        tenders.id,
        tenders.summary
        tenders.date,
        business.name as business_name
      FROM tenders
      JOIN business ON tenders.business_id = business.id
      WHERE
        business.name ILIKE ${`%${query}%`} OR
        tenders.summary ILIKE ${`%${query}%`}
        ${datefilter(min_date, max_date)}
      ORDER BY tenders.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return tenders.rows;
  } catch (error) {
    console.error('Database Error:', error);
    return tenders

    throw new Error('Failed to fetch tenders.');
  }
}

export async function fetchTendersPages(query: string, min_date: Date, max_date: Date) {
  try {
    const count = await sql`SELECT COUNT(*)
    FROM tenders
    JOIN business ON tenders.business_id = business.id
    WHERE
      business.name ILIKE ${`%${query}%`} OR
      tenders.summary ILIKE ${`%${query}%`}
      ${datefilter(min_date, max_date)}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    return tenders.length
    throw new Error('Failed to fetch total number of tenders.');
  }
}

export async function fetchTenderById(id: string) {
  try {
    const data = await sql<TenderForm>`
      SELECT
        tenders.id,
        tenders.business_id,
        tenders.summary,
        tenders.date,
        # tenders.documents,
      FROM tenders
      WHERE tenders.id = ${id};
    `;

    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    return tenders[0]
    throw new Error('Failed to fetch tender.');
  }
}