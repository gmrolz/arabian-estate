# Google Sheets Listings Setup

Use a Google Sheet as your listings data source — no database needed.

## 1. Create Your Sheet

Create a new Google Sheet with a **header row** (first row) and your listings below.

### Required columns (any order, case-insensitive)

| Column       | Example                    | Notes                          |
|-------------|----------------------------|--------------------------------|
| title       | 3BR Fully Finished — R7    | Or use title_en / title_ar     |
| developer   | Misr Italia                |                                |
| project     | Vinci                      | Compound name                  |
| location    | R7                         | Zone / building                |
| unit_type   | Apartment                  |                                |
| area        | 164                        | Square meters                  |
| rooms       | 3                          | Bedrooms                       |
| toilets     | 3                          | Bathrooms                     |
| downpayment | 1,236,000                  | EGP                            |
| monthly_inst| 92,000                     | EGP per month                  |
| price       | 12,366,000                 | Total EGP                      |
| finishing   | Fully Finished             |                                |
| delivery    | 2025                       |                                |
| featured    | yes                        | yes/1/true = show in Best Choices |
| area_slug   | new-capital                | new-capital, new-cairo, mostakbal-city, etc. |
| images      | url1, url2, url3           | Comma-separated image URLs     |

### Optional columns

- `unit_code` — Unit identifier
- `title_en`, `title_ar` — Bilingual titles
- `developer_en`, `developer_ar`, `project_en`, `project_ar` — Bilingual

## 2. Publish to Web

1. **File** → **Share** → **Publish to web**
2. Choose **Entire document** or the specific sheet
3. Format: **Comma-separated values (.csv)**
4. Click **Publish**

## 3. Get the Sheet ID

From your sheet URL:
```
https://docs.google.com/spreadsheets/d/1ABC123xyz456/edit
                                    ^^^^^^^^^^^
                                    This is your Sheet ID
```

## 4. Add to .env

Create or edit `.env` in the project root:

```
VITE_GOOGLE_SHEET_ID=1ABC123xyz456
```

Restart the dev server (`npm run dev`) after changing `.env`.

## Priority

- If **Supabase** is configured → listings come from Supabase
- Else if **VITE_GOOGLE_SHEET_ID** is set → listings come from Google Sheet
- Else → static fallback data is used
