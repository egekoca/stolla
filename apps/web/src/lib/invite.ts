/**
 * Community invite links: a durable URL pattern that lands a new visitor on
 * a community's detail page with a "You've been invited" banner.
 *
 * This is the simple, unsigned `?invite=1` variant described in the issue
 * (rather than a signed token) since it never grants any privilege itself —
 * it only toggles a presentational banner. The invite can never substitute
 * for wallet auth: see `InviteBanner`, which prompts wallet connect rather
 * than bypassing it.
 */

export const INVITE_QUERY_PARAM = "invite";
export const INVITE_QUERY_VALUE = "1";

/** Builds the canonical invite URL for a community, e.g. for sharing. */
export function buildInviteUrl(communityId: string, origin: string): string {
  return `${origin}/communities/${communityId}?${INVITE_QUERY_PARAM}=${INVITE_QUERY_VALUE}`;
}

/**
 * Returns `true` only when the invite query parameter is present with
 * exactly its expected value. Any other value (including a stray signed
 * token this build doesn't recognize) is treated as "no invite intent"
 * rather than an error, so a stale or malformed link just loads the page
 * normally instead of banner-less failing.
 */
export function hasInviteIntent(searchParams: URLSearchParams): boolean {
  return searchParams.get(INVITE_QUERY_PARAM) === INVITE_QUERY_VALUE;
}
