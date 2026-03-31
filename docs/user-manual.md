# Creapy User Manual

This manual covers the current Creapy web experience using the visible labels and navigation shown in the app.

## Shared Navigation

1. Open the site landing page.
   Expected visible behavior: the top bar shows the `Real Estate` logo, a search field with `Search locations, listings...`, and navigation links including `Home`, `About`, and `Properties`.
2. Use the top search field or the home hero search.
   Expected visible behavior: typing in either search field updates the text box, and submitting opens the `Listing Results` page.
3. Open `Properties`.
   Expected visible behavior: the page shows a left `Filters` panel and a right `Listing Results` area.
4. Open any property card from search results or highlighted home sections.
   Expected visible behavior: the listing details page opens with a large image gallery, price text, address, `Description`, room and bath details, and an `Owner Details` card.

## Create an Account

1. Open `Sign Up`.
   Expected visible behavior: the page heading reads `Create your account` and the helper text says `Join to save listings and manage your profile.`
2. Enter `User Name`, `Email`, and `Password`.
   Expected visible behavior: each field accepts input and keeps the typed value visible.
3. In `I am a:`, select either `Tenant` or `Landlord`.
   Expected visible behavior: the selected radio option is filled in.
4. Select `Sign Up`.
   Expected visible behavior: the button shows a loading indicator while submitting, then a success toast appears with `User Successfully Created`.
5. Wait for the app to continue.
   Expected visible behavior: the app does not open a dashboard yet. Instead it shows a pending verification confirmation and directs the user to complete email verification first.
6. Open the email verification link so the app lands on `/verify-email`.
   Expected visible behavior: after verification succeeds, the app logs the user in automatically and redirects to `/dashboard/landlord` for landlord accounts or `/dashboard/tenant` for tenant accounts.

## Log In

1. Open `Login`.
   Expected visible behavior: the page heading reads `Welcome back` and the helper text says `Log in to continue searching and saving listings.`
2. Enter `Email` and `Password`.
   Expected visible behavior: both values remain visible in their fields, and the eye icon toggles password visibility.
3. Select `Login`.
   Expected visible behavior: if the email has already been verified, the button shows a loading indicator, then the app routes to the dashboard that matches the signed-in role.
4. Try to log in before verifying a newly created account.
   Expected visible behavior: the app blocks access to any dashboard and shows a clear message telling the user to verify the email address before logging in.

## Landlord Journey

### Open the Landlord Dashboard

1. Log in with a landlord account.
   Expected visible behavior: the header shows `Dashboard`, `Create Listing`, and the avatar menu.
2. Open `Dashboard`.
   Expected visible behavior: the page heading reads `My Listings` and the main action button reads `+ Create New Listing`.

### Create a Listing

1. Select `Create Listing` from the header or `+ Create New Listing` from the dashboard.
   Expected visible behavior: the page heading reads `Create a Listing`.
2. Fill in the main property fields:
   `Name`, `Description`, `Address`, `Contact Number`, `Province`, `Total Rooms *`, `Bedrooms (optional)`, `Baths`, and `Regular Price`.
   Expected visible behavior: each field accepts input, and `Province` opens a dropdown with `Select a province` plus province options.
3. Review the property options.
   Expected visible behavior: `Rent` is the available listing type, and the checkboxes `Furnished`, `Offer`, `Solar`, `Borehole`, `Security`, `Parking`, and `Internet` can be switched on or off.
4. If `Offer` is enabled, fill in `Discounted Price`.
   Expected visible behavior: the `Discounted Price` field appears only when `Offer` is checked.
5. In `Images`, choose one or more image files and select `Upload`.
   Expected visible behavior: uploaded images appear in a list below the upload area, the first image becomes the cover image, and each uploaded image has a `Delete` button.
6. Select `Create Listing`.
   Expected visible behavior: the button shows a loading state, a success toast appears with `Listing Created Successfully`, and the app returns to the landlord dashboard.

### Manage Listings from the Dashboard

1. Review the `My Listings` table.
   Expected visible behavior: each row shows `Listing`, `Location`, `Status`, `Published`, and `Actions`.
2. Select a listing name.
   Expected visible behavior: the public listing details page opens for that property.
3. Select the `✏️` action on an active listing.
   Expected visible behavior: the edit form opens with the heading `Update a Listing` and the current values prefilled.
4. Select `Update Listing` after editing.
   Expected visible behavior: a success toast appears with `Listing Updated Successfully`, then the app returns to the dashboard.
5. Select the `🗑️` action on an editable listing.
   Expected visible behavior: the row is removed after deletion and no longer appears in `My Listings`.

### Pay to Publish or Restore a Listing

1. Find a listing with a `Pending Payment` badge or an `Inactive` badge.
   Expected visible behavior: its action button reads `Pay Now` or `Revive (Pay to Restore)`.
2. Select that action button.
   Expected visible behavior: the payment page opens with either `Activate Your Listing` or `Revive Your Listing`.
3. Confirm the page details.
   Expected visible behavior: the card shows the listing name, `Activation Fee`, and the field `Your EcoCash Number`.
4. Enter a number and select `Send Payment Request`.
   Expected visible behavior: the screen changes to `Waiting for EcoCash confirmation...`, shows a `Reference:` value, and displays a three-step instruction list.
5. Complete the prompt and wait for confirmation.
   Expected visible behavior: a success state with a green check icon appears and the app returns to the landlord dashboard automatically.

### Review Payment History

1. Scroll below `My Listings` on the landlord dashboard.
   Expected visible behavior: the section heading reads `Payment History`.
2. Review existing rows.
   Expected visible behavior: each row shows `Date`, `Listing`, `Amount`, and `Status`, and status appears as a visible badge such as `Pending`, `Success`, or `Failed`.

## Tenant Journey

### Open the Tenant Dashboard

1. Log in with a tenant account.
   Expected visible behavior: opening `Dashboard` loads a page titled `Tenant Dashboard` with the subtitle `Manage your premium plan and saved searches.`

### Upgrade to Premium

1. In the `Premium Membership` card, review the current membership state.
   Expected visible behavior: the card shows either `No Premium` or `Premium Active`.
2. If the account is not premium, select `Upgrade to Premium`.
   Expected visible behavior: the payment form opens and shows `Premium price`, `Duration: 30-day membership`, and the field `Your EcoCash Number`.
3. Enter a number and select `Send Payment Request`.
   Expected visible behavior: a toast appears saying `Payment request sent. Approve the prompt on your phone.`
4. Wait on the dashboard.
   Expected visible behavior: a spinner appears with `Waiting for payment confirmation. Checking every 5 seconds...`
5. Finish the payment prompt on the phone.
   Expected visible behavior: the form closes and a success toast appears with `Premium activated!`
6. Review the updated membership card.
   Expected visible behavior: the card shows `Premium Active`, an `Active until:` date, and a remaining days message. Near expiry, a `Renew Premium` button appears.

### Save and Review Searches

1. Open `Saved Searches` or the tenant dashboard saved-search section.
   Expected visible behavior: tenant users can see saved-search content; non-tenant users see `Only tenant accounts can use saved searches.`
2. On the standalone `Saved Searches` page, fill in `Name`, `Location / Area`, `Min Rent`, `Max Rent`, and `Min Beds`.
   Expected visible behavior: the form shows amenity checkboxes for `Solar`, `Borehole`, `Security`, `Parking`, and `Internet`.
3. Select `Save Search`.
   Expected visible behavior: the new search appears under `Your Saved Searches`.
4. Review the tenant dashboard `Saved Searches` card.
   Expected visible behavior: each item shows its name, location and rent summary, minimum beds, amenities summary, and `Last notified`.
5. Select `View` from the tenant dashboard saved-search card.
   Expected visible behavior: the app opens the search/properties page.
6. Select `Delete`.
   Expected visible behavior: the selected saved search disappears from the list and a success toast appears with `Saved search deleted successfully`.

### Search for Properties

1. Open `Properties` from the top navigation or run a search from the home page.
   Expected visible behavior: the search page shows `Filters` on the left and `Listing Results` on the right.
2. Use the filters `Province`, `Rent Range`, `Min Rooms`, `Amenities`, listing type options `All Listings` or `Rent`, `Offer`, `Parking`, `Furnished`, and `Sort`.
   Expected visible behavior: each control updates visually when changed.
3. Select `Search`.
   Expected visible behavior: matching cards appear under `Listing Results`, or an empty state card shows `No results found`.
4. Select a property card.
   Expected visible behavior: the full listing page opens with the image gallery, address, description, room and bath details, and `Owner Details`.
5. If a result shows the `⚡ Early Access` badge, open it as a premium tenant.
   Expected visible behavior: the badge remains visible on the card and listing page, and the page shows the early-access notice text below the price badges.

### Update Profile

1. Open the avatar menu and select `Profile`.
   Expected visible behavior: the page heading reads `Profile`.
2. Select the avatar image.
   Expected visible behavior: the file chooser opens, and after upload the page shows `Image Successfully Uploaded!`
3. Update `User Name`, `Email`, or `Password`.
   Expected visible behavior: each field keeps the typed value visible.
4. Select `Update`.
   Expected visible behavior: a success toast appears with `User Updated Successfully`, and the app routes back to the home page.
5. Select `Delete Account` only when intentionally removing the account.
   Expected visible behavior: after deletion the app routes to `Login`.
