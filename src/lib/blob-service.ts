import { put, del } from '@vercel/blob';
import { db } from './firebase.config';
import { addDoc, collection, getDocs, query, where, deleteDoc, doc, getDoc } from 'firebase/firestore';

interface StoredDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  userId: string;
}

export async function uploadDocument(
  file: File,
  userId: string
): Promise<StoredDocument> {
  try {
    // Create a unique filename with timestamp to avoid conflicts
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const uniqueFilename = `${file.name.split('.')[0]}_${timestamp}.${fileExtension}`;
    
    // Upload to Vercel Blob
    const result = await put(uniqueFilename, file, {
      access: 'public',
      token: process.env.NEXT_PUBLIC_BLOB_TOKEN,
      // Remove addRandomSuffix to avoid CORS issues
    });

    // Create document metadata in Firestore
    const docData = {
      fileName: file.name, // Store original filename for display
      fileUrl: result.url,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
      userId
    };

    const docRef = await addDoc(collection(db, 'documents'), docData);

    return {
      id: docRef.id,
      ...docData
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

export async function getUserDocuments(userId: string): Promise<StoredDocument[]> {
  try {
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<StoredDocument, 'id'>
    }));
  } catch (error) {
    console.error('Error getting user documents:', error);
    throw error;
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  try {
    // Get the document reference
    const documentRef = doc(db, 'documents', documentId);
    
    // Get the document data to access the file URL
    const documentSnapshot = await getDoc(documentRef);
    const documentData = documentSnapshot.data();
    
    if (!documentData) {
      throw new Error('Document not found');
    }
    
    // Delete the file from Vercel Blob if URL exists
    if (documentData.fileUrl) {
      // When using addRandomSuffix: true, we need to delete using the full URL
      await del(documentData.fileUrl, {
        token: process.env.NEXT_PUBLIC_BLOB_TOKEN
      });
    }
    
    // Delete the document from Firestore
    await deleteDoc(documentRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
} 