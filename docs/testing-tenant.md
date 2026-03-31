# Tenant Manual QA Checklist

Use this checklist against the current frontend. Record pass or fail based on visible page behavior only.

## Authentication and Navigation

- [ ] Open `Sign Up`, keep `Tenant` selected, complete the form, and select `Sign Up`.
Expected visible behavior: a success toast says `User Successfully Created`, then the app shows a pending verification confirmation instead of opening the tenant dashboard.
- [ ] Open the verification link so the app lands on `/verify-email`.
Expected visible behavior: verification succeeds, the user is logged in automatically, and the tenant dashboard opens.
- [ ] Try to log in with the new tenant account before verifying the email.
Expected visible behavior: login is rejected, no dashboard opens, and a clear message tells the user to verify the email address before logging in.
- [ ] Open `Login`, enter tenant credentials, and select `Login`.
Expected visible behavior: the tenant dashboard loads with the title `Tenant Dashboard`.
- [ ] Open the top navigation after login.
Expected visible behavior: `Dashboard` is available from the header, and the avatar menu opens with account actions including `Profile`.

## Tenant Dashboard

- [ ] Open `Dashboard` as a tenant.
Expected visible behavior: the subtitle reads `Manage your premium plan and saved searches.`
- [ ] Review the `Premium Membership` card for a non-premium tenant.
Expected visible behavior: the card shows a `No Premium` chip, helper text about upgrading, and an `Upgrade to Premium` button.
- [ ] Review the `Premium Membership` card for an active premium tenant.
Expected visible behavior: the card shows a `Premium Active` chip, `Active until:` date text, and a remaining-days message. Near expiry, `Renew Premium` is visible.
- [ ] Review the `Saved Searches` card with no saved searches.
Expected visible behavior: the card says `No saved searches yet. Use the search page to save a search.`
- [ ] Review the `Saved Searches` card with saved searches present.
Expected visible behavior: each item shows its name, a criteria summary, `Last notified`, and `View` and `Delete` buttons.
- [ ] Select `View` on a saved search from the tenant dashboard card.
Expected visible behavior: the app opens the `Properties` search page. Do not expect criteria from that saved search to be applied automatically.

## Premium Upgrade Flow

- [ ] Select `Upgrade to Premium` or `Renew Premium`.
Expected visible behavior: the payment form expands and shows `Premium price`, `Duration: 30-day membership`, `Your EcoCash Number`, `Send Payment Request`, and `Cancel`.
- [ ] Select `Cancel`.
Expected visible behavior: the payment form closes.
- [ ] Reopen the payment form, enter a phone number, and select `Send Payment Request`.
Expected visible behavior: a toast says `Payment request sent. Approve the prompt on your phone.`
- [ ] Wait on the payment form after submission.
Expected visible behavior: a spinner appears with `Waiting for payment confirmation. Checking every 5 seconds...`
- [ ] Complete a successful premium activation.
Expected visible behavior: the payment form closes, a toast says `Premium activated!`, and the membership card changes to `Premium Active`.

## Property Search

- [ ] Open `Properties`.
Expected visible behavior: the page shows the `Filters` heading on the left and `Listing Results` on the right.
- [ ] Verify the search controls.
Expected visible behavior: the filter panel includes `Search`, `Province`, `Rent Range`, `Min Rooms`, `Amenities`, the radio options `All Listings` and `Rent`, the checkboxes `Offer`, `Parking`, `Furnished`, the `Sort` selector, and a `Search` button.
- [ ] Run a search that returns no matches.
Expected visible behavior: an empty card appears with `No results found`.
- [ ] Run a search that returns matches.
Expected visible behavior: property cards appear showing image, property name, address, description preview, price, `Rent` badge, room count, and bath count.
- [ ] Select `Show More` when available.
Expected visible behavior: more listing cards are appended below the existing results.
- [ ] Open a card with the `⚡ Early Access` badge.
Expected visible behavior: the badge is visible on the card and also on the listing details page.

## Listing Details

- [ ] Open any property card from `Listing Results`.
Expected visible behavior: the listing page shows a large image gallery, the property title with price, the address line, `Description`, room and bath details, and `Owner Details`.
- [ ] Review the owner card while logged out.
Expected visible behavior: the card shows `Address` and a lock prompt, without showing email or phone details.
- [ ] Review the owner card while logged in.
Expected visible behavior: the card shows `Address` plus the owner email and phone details.
- [ ] Open an early-access listing as a premium tenant.
Expected visible behavior: the blue early-access notice text appears below the listing price badges.

## Saved Searches

- [ ] Open the standalone `Saved Searches` page as a tenant.
Expected visible behavior: the page heading reads `Saved Searches`, and the form section heading reads `Create`.
- [ ] Verify the creation form labels.
Expected visible behavior: the form shows `Name`, `Location / Area`, `Min Rent`, `Max Rent`, `Min Beds`, and amenity checkboxes for `Solar`, `Borehole`, `Security`, `Parking`, and `Internet`.
- [ ] Select `Save Search`.
Expected visible behavior: the search appears under `Your Saved Searches`.
- [ ] Select `Delete` on a saved search from the standalone page.
Expected visible behavior: that saved search disappears from `Your Saved Searches`.
- [ ] Open the standalone `Saved Searches` page as a non-tenant account.
Expected visible behavior: the page shows `Only tenant accounts can use saved searches.`

## Profile

- [ ] Open `Profile` from the avatar menu.
Expected visible behavior: the page heading reads `Profile` and shows the current avatar.
- [ ] Select the avatar image and upload a valid image file.
Expected visible behavior: the page shows `Image Successfully Uploaded!`
- [ ] Update `User Name`, `Email`, or `Password`, then select `Update`.
Expected visible behavior: a success toast says `User Updated Successfully` and the app returns to the home page.
- [ ] Select `Delete Account`.
Expected visible behavior: after the account is removed, the app routes to `Login`.
