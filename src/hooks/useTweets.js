import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';

export function useTweets(statusFilter = null) {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const col = collection(db, 'tweets');
    let q;
    if (statusFilter) {
      q = query(col, where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
    } else {
      q = query(col, orderBy('createdAt', 'desc'));
    }

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTweets(data);
      setLoading(false);
    }, (err) => {
      console.error('tweets listener error:', err);
      setLoading(false);
    });

    return unsub;
  }, [statusFilter]);

  return { tweets, loading };
}

export async function addTweet(data) {
  const col = collection(db, 'tweets');
  return addDoc(col, {
    content: data.content || '',
    threadParts: data.threadParts || [],
    type: data.type || 'announcement',
    status: 'draft',
    source: data.source || 'manual',
    sourceRef: data.sourceRef || null,
    dayNumber: data.dayNumber || null,
    media: data.media || [],
    xPostId: null,
    xPostUrl: null,
    createdAt: serverTimestamp(),
    postedAt: null,
    updatedAt: serverTimestamp(),
  });
}

export async function updateTweet(id, updates) {
  const ref = doc(db, 'tweets', id);
  return updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteTweet(id) {
  const ref = doc(db, 'tweets', id);
  return deleteDoc(ref);
}

export async function approveTweet(id) {
  return updateTweet(id, { status: 'approved' });
}

export async function markAsPosted(id, xPostUrl = '') {
  return updateTweet(id, {
    status: 'posted',
    postedAt: serverTimestamp(),
    xPostUrl: xPostUrl || null,
  });
}
