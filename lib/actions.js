'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  insertSubmission,
  incrementReaction,
  approveSubmissionRow,
  rejectSubmissionRow,
  setFeaturedPost,
} from './db';
import { isAdminAuthenticated, setAdminCookie, clearAdminCookie } from './auth';

function requireAdmin() {
  if (!isAdminAuthenticated()) {
    throw new Error('Not authorized');
  }
}

// --- Public actions ---------------------------------------------------

export async function submitPost(formData) {
  const title = (formData.get('title') || '').toString().trim();
  const body = (formData.get('body') || '').toString().trim();
  const name = (formData.get('name') || '').toString().trim();
  const email = (formData.get('email') || '').toString().trim();

  if (!title || !body) {
    redirect('/submit?error=missing');
  }

  await insertSubmission({ title, body, name, email });
  redirect('/submit?success=1');
}

export async function reactToPost(slug, type) {
  await incrementReaction(slug, type);
  revalidatePath(`/post/${slug}`);
  revalidatePath('/');
}

// --- Admin auth ---------------------------------------------------------

export async function adminLogin(formData) {
  const password = (formData.get('password') || '').toString();
  if (password && process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
    setAdminCookie();
    redirect('/admin');
  }
  redirect('/admin?error=1');
}

export async function adminLogout() {
  clearAdminCookie();
  redirect('/admin');
}

// --- Admin moderation -----------------------------------------------------

export async function approveSubmission(id) {
  requireAdmin();
  await approveSubmissionRow(id);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function rejectSubmission(id) {
  requireAdmin();
  await rejectSubmissionRow(id);
  revalidatePath('/admin');
}

export async function setFeatured(slug) {
  requireAdmin();
  await setFeaturedPost(slug);
  revalidatePath('/admin');
  revalidatePath('/');
}
