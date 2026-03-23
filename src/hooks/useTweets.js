import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useTweets() {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tweets'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTweets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  return { tweets, loading };
}

export async function addTweet(data) {
  return addDoc(collection(db, 'tweets'), {
    content: data.content || '', threadParts: data.threadParts || [],
    type: data.type || 'announcement', status: 'draft',
    source: data.source || 'manual',
    sourceRef: data.sourceRef || null, dayNumber: data.dayNumber || null,
    media: data.media || [], xPostId: null, xPostUrl: null,
    createdAt: serverTimestamp(), postedAt: null, updatedAt: serverTimestamp(),
  });
}

export async function updateTweet(id, updates) {
  return updateDoc(doc(db, 'tweets', id), { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteTweet(id) { return deleteDoc(doc(db, 'tweets', id)); }

export async function approveTweet(id) { return updateTweet(id, { status: 'approved' }); }

export async function markAsPosted(id, xPostUrl = '') {
  return updateTweet(id, { status: 'posted', postedAt: serverTimestamp(), xPostUrl: xPostUrl || null });
}
