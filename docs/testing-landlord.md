# Landlord Manual QA Checklist

Use this checklist against the current frontend. Record pass or fail based on what is visible in the browser.

## Authentication and Navigation

- [ ] Open `Sign Up`, select `Landlord`, complete the form, and select `Sign Up`.
Expected visible behavior: a success toast says `User Successfully Created`, then the app shows a pending verification confirmation instead of opening the landlord dashboard.
- [ ] Open the verification link so the app lands on `/verify-email`.
Expected visible behavior: verification succeeds, the user is logged in automatically, and the landlord dashboard opens.
- [ ] Try to log in with the new landlord account before verifying the email.
Expected visible behavior: login is rejected, no dashboard opens, and a clear message tells the user to verify the email address before logging in.
- [ ] Open `Login`, enter landlord credentials, and select `Login`.
Expected visible behavior: the landlord dashboard loads, and the header shows `Dashboard`, `Create Listing`, and the avatar menu.
- [ ] Open the avatar menu after login.
Expected visible behavior: the menu shows the signed-in user details and navigation options including `Profile` and logout.

## Dashboard States

- [ ] Open `Dashboard` with no landlord listings available.
Expected visible behavior: the page heading reads `My Listings`, and the empty state card says `No listings yet. Create your first listing.` with a `Create Listing` button.
- [ ] Open `Dashboard` with at least one landlord listing available.
Expected visible behavior: the `My Listings` table appears with the headers `Listing`, `Location`, `Status`, `Published`, and `Actions`.
- [ ] Scroll to `Payment History`.
Expected visible behavior: the section heading `Payment History` is visible and shows either a table or the message `No payment history yet.`

## Create Listing Form

- [ ] Select `Create Listing` from the header.
Expected visible behavior: the page heading reads `Create a Listing`.
- [ ] Verify the form labels.
Expected visible behavior: the form shows `Name`, `Description`, `Address`, `Contact Number`, `Province`, `Total Rooms *`, `Bedrooms (optional)`, `Baths`, `Regular Price`, and `Images`.
- [ ] Open the `Province` selector.
Expected visible behavior: the dropdown includes `Select a province` and province options.
- [ ] Toggle `Furnished` and `Offer`.
Expected visible behavior: each checkbox shows a checked state when enabled, and `Discounted Price` appears only after `Offer` is enabled.
- [ ] Toggle the amenity options `Solar`, `Borehole`, `Security`, `Parking`, and `Internet`.
Expected visible behavior: each amenity checkbox can be independently checked and unchecked.
- [ ] Try selecting images without pressing `Upload`.
Expected visible behavior: the files appear only in the browser file chooser state; they do not appear in the uploaded image list yet.
- [ ] Select images and press `Upload`.
Expected visible behavior: each uploaded image appears in a preview row below the upload control and each row includes a `Delete` button.
- [ ] Submit the form with valid content using `Create Listing`.
Expected visible behavior: the button shows a loading state, a success toast says `Listing Created Successfully`, and the app returns to the landlord dashboard.

## Listing Management

- [ ] Select a listing name from `My Listings`.
Expected visible behavior: the public listing page opens with the property title, image gallery, address, `Description`, and `Owner Details`.
- [ ] Select the `✏️` action for an editable listing.
Expected visible behavior: the page heading changes to `Update a Listing`, and the form fields contain the existing listing values.
- [ ] Change a field and select `Update Listing`.
Expected visible behavior: a success toast says `Listing Updated Successfully` and the app returns to the landlord dashboard.
- [ ] Select `Delete` under an uploaded image while editing.
Expected visible behavior: the selected image preview disappears from the image list.
- [ ] Select the `🗑️` action on an editable listing.
Expected visible behavior: the listing row disappears from `My Listings`.

## Listing Payment Flow

- [ ] Open a listing row with status `Pending Payment` and select `Pay Now`.
Expected visible behavior: the payment page opens with a `Pending Payment` pill and the heading `Activate Your Listing`.
- [ ] Open a listing row with status `Inactive` and select `Revive (Pay to Restore)`.
Expected visible behavior: the payment page opens with an `Inactive — Revive Listing` pill and the heading `Revive Your Listing`.
- [ ] On the payment page, verify the summary card.
Expected visible behavior: the card shows the listing name, `Activation Fee`, `Your EcoCash Number`, and a `Send Payment Request` button.
- [ ] Select `Send Payment Request`.
Expected visible behavior: the page switches to `Waiting for EcoCash confirmation...`, shows a `Reference:` value, and displays the three on-screen payment steps.
- [ ] Complete a successful payment.
Expected visible behavior: the success state appears with a green check icon and the app returns to the landlord dashboard automatically.

## Payment History and Status Badges

- [ ] Review listing status pills in `My Listings`.
Expected visible behavior: listings show visible badges such as `Pending Payment`, `Early Access`, `Active`, or `Inactive`.
- [ ] Review payment rows in `Payment History`.
Expected visible behavior: each row shows `Date`, `Listing`, `Amount`, and a visible status badge such as `Pending`, `Success`, or `Failed`.
