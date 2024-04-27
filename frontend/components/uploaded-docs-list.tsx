'use client'

import { listCompanyDocuments, deleteCompanyDocument, downloadCompanyDocument } from '@/lib/serverfunctions/storage-actions';
import { type DialogProps } from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UploadedDocsListProps extends DialogProps {
    uploadCount: number;
}

export function UploadedDocsList({
    uploadCount,
    ...props
}: UploadedDocsListProps) {
    const [fileList, setFileList] = useState<string[]>([]);

    useEffect(() => {
        console.log('Fetching files');
        // Create a new instance of the Storage client
        listCompanyDocuments().then((files) => {
            setFileList(files);
        });
    }, [uploadCount]);

    // Return a pretty table with the file names and a delete button and a download button
    return (
        <>
            {fileList.length === 0 ? (
                <p>Er zijn nog geen bestanden geüpload</p>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="text-left">Bestandsnaam</th>
                            <th className="text-right">Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fileList.map((fileName) => (
                            <tr key={fileName}>
                                <td className="text-left">{fileName}</td>
                                <td className="text-right">
                                    <button className="text-red-600 hover:text-red-800" onClick={() => {
                                        // Delete the file
                                        deleteCompanyDocument(fileName);
                                        // Update the file list
                                        setFileList(fileList.filter((file) => file !== fileName));
                                        toast.success(`Bestand ${fileName} verwijderd`);
                                    }}>Verwijderen</button>
                                    <button className="ml-2 text-blue-600 hover:text-blue-800" onClick={() => {
                                        // Download the file
                                        downloadCompanyDocument(fileName).then((url) => {
                                            if (!url) {
                                                console.error('Error downloading file');
                                                return;
                                            }
                                            // Open the link in a new tab
                                            window.open(url, '_blank');
                                        });
                                    }}>Downloaden</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}