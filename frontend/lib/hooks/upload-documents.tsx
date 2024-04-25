'use server'

import { Storage } from "@google-cloud/storage";
import { Readable } from 'stream';

export async function uploadFiles(formData: FormData) {
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

    const fileUpload = storage.bucket('company_docs').file(file.name)
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
