import { Message } from 'ai'

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
    error: string
  }
>

export interface Session {
  user: {
    id: string
    email: string
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
}

export type TenderDocument = {
  id: string;
  title: string;
  download_link: string
  extension: string

}

export type Tender = {
  publicatieid: number
  publicatiedatum: Date
  aanbestedingnaam: string
  aanbestedendedienstnaam: string
  opdrachtgevernaam: string
  sluitingsdatum: Date
  digitaal: boolean
  europees: boolean
  isvroegtijdigebeeindiging: boolean
  opdrachtbeschrijving: string
  typepublicatiecode: string
  typepublicatieomschrijving: string
  procedurecode: string
  procedureomschrijving: string
  typeopdrachtcode: string
  typeopdrachtomschrijving: string
  publicatiecodecode: string
  publicatiecodeomschrijving: string
  publicatiestatuscode: string
  publicatiestatusomschrijving: string
  linkhref: string
  linktitle: string
  documents: TenderDocument[]
}

export type Business = {
  id: number
  name: string
}