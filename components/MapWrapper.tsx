'use client';

/**
 * MapWrapper
 * Thin client-boundary shell. StadiumMap is already a Client Component
 * (uses useState for zone interaction), so this just passes through.
 * Kept as a separate file so the Server Component page.tsx doesn't need
 * to change if we ever swap the map implementation again.
 */
export { default } from './StadiumMap';
