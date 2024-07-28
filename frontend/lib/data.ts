import { sql } from '@vercel/postgres';

import {
  Tender
} from './types';

const datefilter = (min_date: string, max_date: string) => {
  let whereClause = '';
  if (min_date) {
    whereClause += `publicatiedatum >= '${min_date}' `;
  }
  if (max_date) {
    if (whereClause.length > 0) {
      whereClause += 'AND ';
    }
    whereClause += `publicatiedatum <= '${max_date}' `;
  }

  return whereClause
}

const textFilter = (query: string) => {
  return `tenders.aanbestedendeDienstNaam ILIKE ${`%${query}%`} OR
  tenders.opdrachtgevermaam ILIKE ${`%${query}%`} OR
  tenders.opdrachtbeschrijving ILIKE ${`%${query}%`}`
}


const ITEMS_PER_PAGE = 6;
export async function fetchFilteredTenders(
  query: string,
  min_date: string,
  max_date: string,
  currentPage: number,
) {
  let whereClause = datefilter(min_date, max_date)

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {

    const tenders = await sql<Tender>`
      SELECT
        *
      FROM publications
      ORDER BY publicatiedatum DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return tenders.rows;
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to fetch tenders.');
  }
}

export async function fetchTendersPages(query: string, min_date: string, max_date: string) {
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
        *
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
<<<<<<< Updated upstream
=======
}

export async function fetchTenderDocuments(id: string): Promise<any> {
  try {
    const data = await sql`
      SELECT
        *
      FROM tenderdocuments
      WHERE tenderid LIKE %${id}%
    `;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch tender documents.');
  }
>>>>>>> Stashed changes
}