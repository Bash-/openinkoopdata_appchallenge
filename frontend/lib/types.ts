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
  id: string
  title: string;
  summary: string
  date: Date,
  business_id: number
  documents: TenderDocument[]
}

export type Business = {
  id: number
  name: string
}

export type TenderTable = {
  id: string
  summary: string
  date: Date,
  business_name: string,
}
