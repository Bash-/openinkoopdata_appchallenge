'use server'

import { sql } from '@vercel/postgres';

import {
  Tender
} from './types';

const datefilter = (min_date: string, max_date: string) => {
  let whereClause = '';
  if (min_date) {
    whereClause += `sluitingsdatum >= '${min_date}' `;
  }
  if (max_date) {
    if (whereClause.length > 0) {
      whereClause += 'AND ';
    }
    whereClause += `sluitingsdatum <= '${max_date}' `;
  }

  return whereClause
}

const textFilter = (query: string) => {
  return `aanbestedendedienstnaam ILIKE '%${query}%' OR
  aanbestedingnaam ILIKE '%${query}%' OR
  opdrachtbeschrijving ILIKE '%${query}%' OR
  publicatieid ILIKE '%${query}%'`
}

const getQueryWhereStatement = (query: string, min_date: string, max_date: string) => {
  let whereClause = 'WHERE 1=1 '
  const dateWhere = datefilter(min_date, max_date);
  if (dateWhere.length > 0) {
    whereClause += 'AND (' + dateWhere + ') ';
  }
  if (query) {
    whereClause += 'AND (' + textFilter(query) + ') ';
  }
  return whereClause;
}


const ITEMS_PER_PAGE = 8;
export async function fetchFilteredTenders(
  query: string,
  min_date: string,
  max_date: string,
  currentPage: number,
) {  
  const whereClause = getQueryWhereStatement(query, min_date, max_date);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  let fullQuery = `
      SELECT *
      FROM publications ${whereClause}
      ORDER BY publicatiedatum DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
  `;

  try {
    const tenders = await sql.query(fullQuery);
    return tenders.rows;
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to fetch tenders.');
  }
}

export async function fetchTendersPages(query: string, min_date: string, max_date: string) {
  try {
    const whereClause = getQueryWhereStatement(query, min_date, max_date);
    
    const count = await sql.query(`SELECT COUNT(*) FROM publications ${whereClause}`)

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
}

export async function fetchTenderDocuments(id: string): Promise<any> {
  try {
    const data = await sql`
      SELECT
        *
      FROM tenderdocuments
      WHERE tenderid = ${id}
    `;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch tender documents.');
  }
}