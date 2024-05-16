import { sql } from '@vercel/postgres';

import {
  Tender
} from './types';

const datefilter = (min_date: Date, max_date: Date) => {
  return `${min_date && max_date ? `AND date BETWEEN ${min_date} AND ${max_date}` : ''}
  ${min_date && !max_date ? `AND date >= ${min_date}` : ''}
  ${!min_date && max_date ? `AND date <= ${min_date}` : ''}`
}

const textFilter = (query: string) => {
  return `tenders.aanbestedendeDienstNaam ILIKE ${`%${query}%`} OR
  tenders.opdrachtgevermaam ILIKE ${`%${query}%`} OR
  tenders.opdrachtbeschrijving ILIKE ${`%${query}%`}`
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
    const tenders = await sql<Tender>`
      SELECT
        publicatieid
        -- aanbestedendedienstnaam,
        -- sluitingsdatum,
        -- opdrachtgevernaam
      FROM publications
      -- ORDER BY publicatiedatum ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return tenders.rows;
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to fetch tenders.');
  }
}

export async function fetchTendersPages(query: string, min_date: Date, max_date: Date) {
  try {
    const count = await sql`SELECT COUNT(*) FROM publications -- INCLUDE WHERE FILTERS`;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of tenders.');
  }
}

export async function fetchTenderById(id: string) {
  try {
    const data = await sql<Tender>`
      SELECT
        publications.publicatieid
        -- publications.opdrachtbeschrijving,
        -- publications.publicatiedatum,
        -- publications.sluitingsdatum,
        -- # tenders.documents,
      FROM publications
      -- INNER JOIN documents on ...
      WHERE publications.publicatieid = ${id}
      LIMIT 1
    `;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch tender.');
  }
}