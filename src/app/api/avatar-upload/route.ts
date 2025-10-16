
import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { db } from '@/firebase/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // You would add auth checks here in a real app to ensure the userId matches the logged-in user
    // e.g., by verifying a bearer token. For now, we trust the client.

    const bucket = getStorage().bucket();
    const filePath = `avatars/${userId}/${file.name}`;
    const fileRef = bucket.file(filePath);

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to GCS
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    });
    
    // Make the file public and get its URL
    await fileRef.makePublic();
    const downloadURL = fileRef.publicUrl();

    // Update user document in Firestore
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.set({ profilePicture: downloadURL }, { merge: true });

    return NextResponse.json({ downloadURL });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Failed to upload avatar', details: error.message }, { status: 500 });
  }
}
