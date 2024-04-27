'use client'

import { type DialogProps } from '@radix-ui/react-dialog';
import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { IconSpinner } from '@/components/ui/icons';
import { uploadFiles } from '@/lib/serverfunctions/storage-actions';
import { Input } from './ui/input';

interface UploadFormProps extends DialogProps {
    uploadCount: number;
    setUploadCount: (count: number) => void;
}

export function UploadForm({
    uploadCount,
    setUploadCount,
    ...props
}: UploadFormProps) {
    const [isSharePending, startShareTransition] = React.useTransition()
    const [fileNames, setFileNames] = React.useState<string[]>([])
    const [files, setFiles] = React.useState<File[]>([])

    const onDrop = (acceptedFiles: File[]) => {
        setFileNames(acceptedFiles.map((file) => file.name));
        setFiles(acceptedFiles);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, 
        accept: { "text/txt": [".txt", ".pdf"] }
    });

    return (
        <>
            <form>
                <Input
                    type="file"
                    // multiple
                    {...getInputProps()}
                    onChange={(e) => {
                        // Update the file names when the user selects files
                        if (e.target.files) {
                            setFileNames(Array.from(e.target.files).map((file) => file.name));
                            setFiles(Array.from(e.target.files));
                        }
                    }}
                />

                <div {...getRootProps()} className={`p-4 space-y-1 text-sm border-4 border-dashed rounded-md mb-4 ${isDragActive ? 'bg-gray-200' : ''}`}>
                    {/* <div className="font-medium">Upload uw documenten</div> */}
                    <input {...getInputProps()} />
                    {isDragActive ? (
                        <p>Sleep de bestanden hier heen ...</p>
                    ) : (
                        <p>Sleep uw bestanden hier naartoe of klik hier</p>
                    )}
                </div>
            </form>

            <div className="p-4 space-y-1 text-sm border rounded-md mb-4 ">
                <div className="font-medium">Geselecteerde bestanden</div>
                {/* Display the file names */}
                {fileNames.map((name, index) => (
                    <div key={index}>{name}</div>
                ))}
            </div>



            <Button
                disabled={isSharePending}
                onClick={() => {
                    if (files.length === 0) {
                        toast.error('Geen bestanden geselecteerd')
                        return
                    }
                    // @ts-ignore
                    startShareTransition(async () => {
                        let formData = new FormData();
                        files.forEach(file => {
                            formData.append('file', file);
                        });

                        uploadFiles(formData).then(x => {
                            setUploadCount(uploadCount + 1);
                            toast.success('Uploaden van bestand(en) gelukt')
                        })
                    })
                }}
            >
                {isSharePending ? (
                    <>
                        <IconSpinner className="mr-2 animate-spin" />
                        {/* Uploading... */}
                    </>
                ) : (
                    <>Uploaden</>
                )}
            </Button>
        </>
    )
}
