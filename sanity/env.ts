export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-02-12'

// We allow either NEXT_PUBLIC (for Next.js) or SANITY_STUDIO (for the Cloud Build)
export const dataset = 
  process.env.NEXT_PUBLIC_SANITY_DATASET || 
  process.env.SANITY_STUDIO_DATASET || 
  'production';

export const projectId = 
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 
  process.env.SANITY_STUDIO_PROJECT_ID || 
  '0xpjcfwe'; // Your project ID

// You can keep the function at the bottom, but we don't need to call it 
// for projectId and dataset anymore since we provided fallbacks.
function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }
  return v
}