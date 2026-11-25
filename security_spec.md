# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default-Deny Safety Net**: Every path outside `/products/{productId}`, `/swatches/{swatchId}`, `/settings/{settingId}`, and `/admins/{userId}` is denied for read and write.
2. **Verified Admin Gate**: All write operations (`create`, `update`, `delete`) across every collection strictly require `request.auth != null`, `request.auth.token.email_verified == true`, and verified admin status (`request.auth.token.email.lower() == 'pinky890114@gmail.com'` OR `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`).
3. **Public Storefront Catalog Isolation**: Unauthenticated shoppers may ONLY read published products (`resource.data.isPublished == true`), public swatches (`resource.data.isPublic == true`), and the singleton `/settings/storefront` document. Unpublished draft products and `/admins/*` records are never readable by non-admins.
4. **Strict Schema & Immutability**: Every create/update validates document IDs (`isValidId`), strict `hasAll`/`hasOnly` keys (no shadow fields), string/array size limits, `updatedBy == request.auth.uid`, immutable `id`/`createdAt`, and server timestamp integrity (`request.time`).
5. **No Self-Assigned Admin Escalation**: Regular authenticated users cannot create, update, or list `/admins/{userId}`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Product Create**: Unauthenticated client attempts `create` on `/products/prod-hack`.
2. **Email Spoofing Attack**: Authenticated user with `email: 'pinky890114@gmail.com'` but `email_verified: false` attempts `update` on `/settings/storefront`.
3. **Non-Admin Product Update**: Verified non-admin user attempts `update` on `/products/prod-oatmeal-overalls`.
4. **Shadow Field Injection**: Verified admin attempts `create` on `/products/prod-shadow` with extra ghost field `isSuperFeatured: true`.
5. **ID Poisoning Attack**: Verified admin attempts `create` on `/products/../../evil$id` or 200-char ID.
6. **Client Timestamp Tampering**: Verified admin attempts `create` on `/products/prod-time` with client-forged `createdAt` != `request.time`.
7. **Immutable Field Mutation**: Verified admin attempts `update` on `/products/prod-oatmeal-overalls` changing `createdAt` or `id`.
8. **Invalid Price/Enum Poisoning**: Verified admin attempts `update` setting `basePrice: -500` or `status: 'hacked'`.
9. **Array Flood / Unbounded List**: Verified admin attempts `create` with 25 `dollSizes` or 20 `images` exceeding array cap.
10. **Draft Product Leak (Query Trust Test)**: Unauthenticated shopper attempts `get` or `list` returning a product with `isPublished: false`.
11. **Self-Assigned Admin Escalation**: Authenticated non-admin attempts `create` on `/admins/{ownUid}` with `role: 'admin'`.
12. **PII Blanket Read on Admins**: Authenticated non-admin attempts `get` on `/admins/{otherAdminUid}` or `list` on `/admins`.
13. **Invalid Swatch Library Enum Poisoning**: Verified admin attempts `create` or `update` on `/swatches/sw-evil` with `libraryType: 'unknown_library'` or missing `libraryType` (must be in `['fabric', 'rhinestone', 'eye_color', 'ribbon_color', 'yarn']`).
14. **Section Visibility Poisoning**: Verified admin attempts `update` on `/settings/storefront` with non-boolean `sectionVisibility.proxy` or extra shadow keys inside `sectionVisibility`.
