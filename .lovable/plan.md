# Fix missing authorization on wishlist and reviews

## Diagnosis
- The failing request is `getWishlist`, despite the copied stack mentioning `submitReview`.
- Public listing cards call the protected wishlist function before confirming that a signed-in session exists.
- The server correctly rejects that unauthenticated call, but the resulting error reaches the page boundary and creates the blank screen.

## Changes
1. Gate wishlist reads in `ListingCard` on a confirmed signed-in session, so public pages never call protected wishlist functions anonymously.
2. Keep wishlist writes protected; signed-out clicks will continue to show the existing sign-in message rather than weakening access control.
3. Verify authenticated wishlist and review pages still send authorization correctly, then test the public home page for no unauthorized request or blank screen.
4. Resolve any build errors reported by the preview before completion.

## Scope
- Frontend request timing only; no database, policy, migration, or authentication-security changes.
