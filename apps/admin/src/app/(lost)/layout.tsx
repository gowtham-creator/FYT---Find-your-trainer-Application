/**
 * Unknown addresses get the console shell too, but from their own route
 * group: the console's loading.tsx wraps every page under (console) in a
 * Suspense boundary, so a notFound() there is streamed after a 200 has gone
 * out. With no loading boundary above it, the catch-all below throws before
 * the response starts and the 404 status reaches the client.
 */
export { default } from "../(console)/layout";
