'use server'

import { Storage } from "@google-cloud/storage";
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { Readable } from 'stream';


const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  credentials: {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY,
  },
});

const bucketName = 'company_docs';

export async function listCompanyDocuments() {
  const session = (await auth()) as Session
  const userId = session.user.id as string

  const folderPath = `${userId}`;

  try {
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: folderPath,
      includeFoldersAsPrefixes: false
    });

    const fileNames = files.map((file) => file.name.split('/')[1]);

    return fileNames;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

export async function deleteCompanyDocument(fileName: string) {
  const session = (await auth()) as Session
  const userId = session.user.id as string
  const filePath = `${userId}/${fileName}`;

  try {
    await storage.bucket(bucketName).file(filePath).delete();
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

export async function downloadCompanyDocument(fileName: string) {
  const session = (await auth()) as Session
  const userId = session.user.id as string
  const filePath = `${userId}/${fileName}`;

  try {
    const [url] = await storage.bucket(bucketName).file(filePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60, // 1 minute
    });
    return url;
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
}

export async function uploadFiles(formData: FormData) {
  const session = (await auth()) as Session
  const userId = session.user.id as string

  const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY,
    },
  });

  for (const x of formData.getAll('file')) {

    const file = x as File;

    const buffer = await file.arrayBuffer()
    const stream = new Readable()
    stream.push(Buffer.from(buffer))
    stream.push(null)

    const fileUpload = storage.bucket('company_docs').file(`${userId}/${file.name}`)
    const fileStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.type,
      },
    })

    await new Promise((resolve, reject) => {
      stream
        .pipe(fileStream)
        .on('error', reject)
        .on('finish', resolve)
    })
  }
}
