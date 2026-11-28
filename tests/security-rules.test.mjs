// Security-rules tests for Firestore and Storage.
//
// How to run (needs Java installed):
//   mkdir /tmp/rules && cd /tmp/rules && npm init -y
//   npm i --legacy-peer-deps firebase-tools @firebase/rules-unit-testing firebase
//   cp <repo>/tests/security-rules.test.mjs <repo>/firestore.rules <repo>/storage.rules .
//   echo '{"firestore":{"rules":"firestore.rules"},"storage":{"rules":"storage.rules"}}' > firebase.json
//   REPO=. npx firebase emulators:exec --only firestore,storage --project demo-livenet "node security-rules.test.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { readFileSync } from 'node:fs';

const repo = process.env.REPO ?? '..';
const env = await initializeTestEnvironment({
  projectId: 'demo-livenet',
  firestore: { rules: readFileSync(`${repo}/firestore.rules`, 'utf8'), host: '127.0.0.1', port: 8080 },
  storage: { rules: readFileSync(`${repo}/storage.rules`, 'utf8'), host: '127.0.0.1', port: 9199 },
});

// Seed data with rules disabled.
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/alice'), { id: 'alice', username: 'alice', email: 'old@x.com' });
  await setDoc(doc(db, 'users/bob'), { id: 'bob', username: 'bob' });
  await setDoc(doc(db, 'broadcasts/s1'), { hostId: 'alice', title: 'Alice live', isLive: true });
  await setDoc(doc(db, 'broadcasts/s1/messages/m1'), { userId: 'bob', message: 'hi' });
  await setDoc(doc(db, 'users/alice/notifications/n1'), { userId: 'alice', actorId: 'bob', type: 'like', isRead: false });
});

const alice = env.authenticatedContext('alice').firestore();
const bob = env.authenticatedContext('bob').firestore();
const anon = env.unauthenticatedContext().firestore();

let pass = 0, fail = 0;
async function t(name, p) {
  try { await p; pass++; console.log('  ok  ', name); }
  catch (e) { fail++; console.log('  FAIL', name, '-', e.message.split('\n')[0]); }
}
const notif = (actor, owner, extra = {}) => ({ userId: owner, actorId: actor, type: 'like', isRead: false, actorName: actor, timestamp: serverTimestamp(), entityInfo: 'liked your stream', ...extra });

console.log('Profiles');
await t('anyone can read a profile', assertSucceeds(getDoc(doc(anon, 'users/alice'))));
await t('new user can create own profile', assertSucceeds(setDoc(doc(bob, 'users/bob'), { id: 'bob', username: 'bob2' })));
await t('cannot create profile for someone else', assertFails(setDoc(doc(bob, 'users/carol'), { id: 'carol' })));
await t('owner can merge-update profile', assertSucceeds(setDoc(doc(alice, 'users/alice'), { bio: 'hey' }, { merge: true })));
await t('cannot edit another profile', assertFails(setDoc(doc(bob, 'users/alice'), { bio: 'hacked' }, { merge: true })));

console.log('Follow (batch like the app does)');
{
  const b = writeBatch(bob);
  b.set(doc(bob, 'users/bob/following/alice'), { userId: 'bob', timestamp: serverTimestamp() });
  b.set(doc(bob, 'users/alice/followers/bob'), { userId: 'bob', timestamp: serverTimestamp() });
  b.set(doc(collection(bob, 'users/alice/notifications')), { userId: 'alice', actorId: 'bob', type: 'follow', isRead: false, timestamp: serverTimestamp() });
  await t('bob follows alice + notifies', assertSucceeds(b.commit()));
}
await t('cannot add fake follower to someone', assertFails(setDoc(doc(bob, 'users/alice/followers/carol'), { userId: 'carol' })));

console.log('Notifications');
await t('bob can notify alice about his like', assertSucceeds(addDoc(collection(bob, 'users/alice/notifications'), notif('bob', 'alice'))));
await t('bob cannot fake a notification from carol', assertFails(addDoc(collection(bob, 'users/alice/notifications'), notif('carol', 'alice'))));
await t('unknown notification type rejected', assertFails(addDoc(collection(bob, 'users/alice/notifications'), notif('bob', 'alice', { type: 'phishing' }))));
await t('bob cannot read alice notifications', assertFails(getDoc(doc(bob, 'users/alice/notifications/n1'))));
await t('alice can mark notification read', assertSucceeds(setDoc(doc(alice, 'users/alice/notifications/n1'), { isRead: true }, { merge: true })));
await t('alice cannot rewrite notification content', assertFails(updateDoc(doc(alice, 'users/alice/notifications/n1'), { actorId: 'zzz' })));

console.log('Broadcasts');
await t('anyone can read a stream', assertSucceeds(getDoc(doc(anon, 'broadcasts/s1'))));
await t('bob can create his own stream', assertSucceeds(setDoc(doc(bob, 'broadcasts/s2'), { hostId: 'bob', title: 'Bob live', isLive: false })));
await t('cannot create stream as someone else', assertFails(setDoc(doc(bob, 'broadcasts/s3'), { hostId: 'alice', title: 'x' })));
await t('host can go live (merge)', assertSucceeds(setDoc(doc(alice, 'broadcasts/s1'), { isLive: true, streamStartedAt: serverTimestamp() }, { merge: true })));
await t('host can update viewerCount', assertSucceeds(updateDoc(doc(alice, 'broadcasts/s1'), { viewerCount: 5 })));
await t('bob cannot end alice stream', assertFails(updateDoc(doc(bob, 'broadcasts/s1'), { isLive: false })));
await t('host cannot hand stream to someone else', assertFails(updateDoc(doc(alice, 'broadcasts/s1'), { hostId: 'bob' })));

console.log('Live chat');
await t('bob can post as himself', assertSucceeds(addDoc(collection(bob, 'broadcasts/s1/messages'), { userId: 'bob', username: 'bob', message: 'hello', timestamp: serverTimestamp() })));
await t('bob cannot post as alice', assertFails(addDoc(collection(bob, 'broadcasts/s1/messages'), { userId: 'alice', message: 'fake' })));
await t('signed-out user cannot post', assertFails(addDoc(collection(anon, 'broadcasts/s1/messages'), { userId: 'x', message: 'spam' })));
await t('message over 500 chars rejected', assertFails(addDoc(collection(bob, 'broadcasts/s1/messages'), { userId: 'bob', message: 'a'.repeat(501) })));
await t('host can delete a chat message', assertSucceeds(deleteDoc(doc(alice, 'broadcasts/s1/messages/m1'))));

console.log('Likes');
await t('bob can like', assertSucceeds(setDoc(doc(bob, 'broadcasts/s1/likes/bob'), { userId: 'bob', timestamp: serverTimestamp() })));
await t('bob can unlike', assertSucceeds(deleteDoc(doc(bob, 'broadcasts/s1/likes/bob'))));
await t('bob cannot like on behalf of alice', assertFails(setDoc(doc(bob, 'broadcasts/s1/likes/alice'), { userId: 'alice' })));

console.log('Storage');
const img = new Uint8Array([137, 80, 78, 71]);
const bobStore = env.authenticatedContext('bob').storage();
await t('bob uploads chat image to his folder', assertSucceeds(uploadBytes(ref(bobStore, 'chat_images/s1/bob/a.png'), img, { contentType: 'image/png' })));
await t('bob cannot upload into alice folder', assertFails(uploadBytes(ref(bobStore, 'chat_images/s1/alice/a.png'), img, { contentType: 'image/png' })));
await t('old flat chat path is read-only', assertFails(uploadBytes(ref(bobStore, 'chat_images/s1/a.png'), img, { contentType: 'image/png' })));
await t('avatar must be an image', assertFails(uploadBytes(ref(bobStore, 'avatars/bob/a.exe'), img, { contentType: 'application/octet-stream' })));
await t('bob uploads his avatar', assertSucceeds(uploadBytes(ref(bobStore, 'avatars/bob/a.png'), img, { contentType: 'image/png' })));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
